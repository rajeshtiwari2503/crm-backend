const fs = require("fs");
const drive = require("./googleAuth");
const ComplaintModal = require("../models/complaint");

const updateComplaintWithVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the complaint
    const complaint = await ComplaintModal.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    let partPendingVideo = complaint.partPendingVideo; // Default to old one

    // Handle video upload if new video provided
    if (req.file?.path) {
      const filePath = req.file.path;
      const fileName = req.file.originalname;

      // Upload new video to Google Drive
      const uploadResponse = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: "video/mp4",
          parents: ["1uwQe3fejYwICa4YVEj92UABXgZ9DbBma"], // Use env for folder ID
        },
        media: {
          mimeType: "video/mp4",
          body: fs.createReadStream(filePath),
        },
        fields: "id",
      });

      const fileId = uploadResponse.data.id;

      // Make video publicly accessible
      await drive.permissions.create({
        fileId,
        requestBody: { role: "reader", type: "anyone" },
      });

      partPendingVideo = `https://drive.google.com/uc?id=${fileId}`;

      // Remove temporary uploaded file from server
      fs.unlinkSync(filePath);

      // Optionally delete old video from Google Drive
      if (complaint.partPendingVideo?.includes("id=")) {
        const oldFileId = complaint.partPendingVideo.split("id=")[1].split("&")[0];
        if (oldFileId && oldFileId !== fileId) {
          await drive.files.delete({ fileId: oldFileId }).catch(console.error);
        }
      }
    }

    // Update the complaint in DB
    const updatedComplaint = await ComplaintModal.findByIdAndUpdate(
      id,
      { ...updates, partPendingVideo },
      { new: true }
    );

    res.status(200).json({
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });

  } catch (error) {
    console.error("Error updating complaint with video:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { updateComplaintWithVideo };

const { google } = require("googleapis");

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials, // ✅ Correct: Passing a parsed object
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

module.exports = drive;


// {
//   "type": "service_account",
//   "project_id": "crucial-utility-455810-m2",
//   "private_key_id": "b9d0133424bc3d49305fe549eada892cc4b74ed3",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwpvM77ULyjaCJ\nYSGvI5SVaIIwDh2lEChhjBGcPnNNyU68nMmaGNOvnsHexP9OXYT5fVcQNNy0+Omb\nEG4VJe0R06PhmzmNuV9gs7zMJSf889kjoPn6hN6kKbbnlce+fLvG5miQIJxg8ZMX\nzGgebDNSYnFS4pRsCvLrkT73neVFV1WtONhxdBXUl+sL7Rx6WJoAtFYo4m46f41v\nznE2zL/5egiIQW9PDLKUGeWmhnqnxRZF08tOBdPXJdI1Nx1qmoj9UCS9D/WBUOKq\n30lDA4lifRmpxzd3DfXtzh+1EZNp6H8po+JdxGaBQYB64M+EQlIMrxM8ygTL8MZ4\nnb7bLJJpAgMBAAECggEADRw5gBCR6o4amdIvcvU+i+oc2LPWJ7pvwhw9mwLC1u/i\nRpA89rvx9fOKgDMkSYIaTNPXDXkG35gmP4peySCum/yWNI0Ac/q2epGhqOWhtp24\nV0hqqljdwdbmCquXOUATmuWIYW3yJ9BgnMsK99BgQgnT+ZVJnk0fuIjn4JkDe3up\ny07epkoeS7VmGa7WAei/5fe14YH5nD7TFw8Ciwd6rmnSVnIZiAF1reLG10CmNOHe\ngIvFeJoXhHIfEUX13vfIBWH4x1xclIH4KhLtVTnuM0I4SC4Nci0M2StkbJSHSWvT\nLq1HpN/IgvfbJS4kqA3A+UBIJCn9UYMsvpDAZwp4aQKBgQDzqpkWQY4jBl2i0AaY\nBLM8ASUCV21OZiY0ySJSfwEcS6//NhiznFgsLETKDFOUSUJQcZ2blBsHSajxYYu3\nkOI+rXVtPtsd5pHcXcCu91bGpUr6PlrmLC3gvSm8ZntyWoPVMigNYPyH6xB9kAzy\nCiSOODOwzi96syyHfvki3cB1LQKBgQC5l/0tHvileE1c8N/7GY8hhRXFEuEu5/eW\npExvmInxG7SBQiKy+RFVkegI/rGrZo0NFxpi5r1uejC8DOgnzunK5TpwixFhEnwK\nIecY0XR9nxf89XQ/8k+jUJzvdB3Vcjcc8bsrCy4HMpk4MqpvCHWOVjE4kKaMrzgv\nDvfwPZbPrQKBgHlkgoQOAMv+PeQBE2fk346DW3bBK5mlVl9x3QGQeHMqWfIhd0j0\nGRFYtKScY386yCjfkY+Sx6xnzB0FZd/79FsZe6kDaZKJ7h0FMBt66eZpLuNg8VQ+\nqlSOqR5NSC7+XTN3m3Ce4vCr8Tk87NYgq3mXElmBPzI31XVjkqcGJv25AoGAEd3M\n1JwnqZ5ELE9P8JdMTRjHuLoRjXdtQUY9yXxwwxI8tTjNqFcL0SYDpWIHbo2nxHvV\n4XF/CPSgXmoLq1Fi9lJM5uqsWKDz6fHLknsPcMxw/bwPXdyQyBMJmI+gE500Kwgm\nUYV4/95iG6Pc/mVdE7++a0iZj++KRBV3ztvO+d0CgYEAiLNq8PcDZzTjehDqFNKo\nDdWRpnigVOzPyYjpjnIXeCpX2afMoUL9XDL/RW7tr0EUSgAwtYQDIeTgmX967oJC\nxaMmtMyS4pZFZLZTJf+4si5TZMd5fa6nKO++3h6d03cokfSm6L1QzCyzhsdw1YQY\nhvpqBP9DHr8sgDNXAjcZHjQ=\n-----END PRIVATE KEY-----\n",
//   "client_email": "part-video@crucial-utility-455810-m2.iam.gserviceaccount.com",
//   "client_id": "113094238522773611770",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/part-video%40crucial-utility-455810-m2.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// }

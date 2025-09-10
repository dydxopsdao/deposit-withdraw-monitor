/**
 * Lambda@Edge function for CloudFront request processing
 * 
 * Architecture: CloudFront -> Lambda@Edge -> S3
 * - Runs at CloudFront edge locations globally for low latency
 * - Intercepts viewer requests before cache lookup or S3 origin access
 * - Provides basic authentication and dynamic directory listing for S3 reports bucket
 * - For directory requests (/), generates HTML index of S3 bucket contents
 * - For file requests, passes through to S3 origin via CloudFront OAC
 * 
 * Template variables (substituted by Terraform):
 * - TF_VAR_AUTH_PASSWORD: Basic auth password from Terraform variable
 * - TF_VAR_BUCKET_NAME: S3 reports bucket name
 * - TF_VAR_BUCKET_REGION: AWS region where S3 bucket is located
 */

const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: 'TF_VAR_BUCKET_REGION'});

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const uri = request.uri;
  
  const authUser = 'viewer';
  const authPass = 'TF_VAR_AUTH_PASSWORD';
  
  const authString = 'Basic ' + Buffer.from(authUser + ':' + authPass).toString('base64');
  
  if (typeof headers.authorization == 'undefined' || headers.authorization[0].value != authString) {
    const body = 'Unauthorized';
    const response = {
      status: '401',
      statusDescription: 'Unauthorized',
      body: body,
      headers: {
        'www-authenticate': [{key: 'WWW-Authenticate', value:'Basic'}]
      }
    };
    return response;
  }
  
  // Handle directory listing requests
  if (uri === '/' || uri.endsWith('/')) {
    try {
      const bucketName = 'TF_VAR_BUCKET_NAME';
      const prefix = uri === '/' ? '' : uri.slice(1); // Remove leading slash
      
      const params = {
        Bucket: bucketName,
        Prefix: prefix,
        Delimiter: '/'
      };
      
      const data = await s3.listObjectsV2(params).promise();
      
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reports Index</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .directory { color: #0066cc; text-decoration: none; display: block; padding: 5px 0; }
            .directory:hover { text-decoration: underline; }
            .file { color: #666; }
            ul { list-style-type: none; padding-left: 0; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>Reports Directory</h1>
          <p>Current path: /$${prefix}</p>
          <ul>
      `;
      
      // Add parent directory link if not at root
      if (prefix !== '') {
        const parentPath = prefix.split('/').slice(0, -2).join('/');
        const parentUrl = parentPath === '' ? '/' : `/$${parentPath}/`;
        html += `<li><a href="$${parentUrl}" class="directory">📁 ../</a></li>`;
      }
      
      // Add subdirectories
      if (data.CommonPrefixes) {
        data.CommonPrefixes.forEach(item => {
          const folderName = item.Prefix.replace(prefix, '').replace('/', '');
          html += `<li><a href="/$${item.Prefix}" class="directory">📁 $${folderName}/</a></li>`;
        });
      }
      
      // Add files (look for index.html in subdirectories)
      if (data.Contents) {
        data.Contents.forEach(item => {
          if (item.Key.endsWith('index.html')) {
            const relativePath = item.Key.replace(prefix, '');
            const fileName = relativePath.split('/').pop();
            html += `<li><a href="/$${item.Key}" class="file">📄 $${fileName}</a></li>`;
          }
        });
      }
      
      html += `
          </ul>
        </body>
        </html>
      `;
      
      const response = {
        status: '200',
        statusDescription: 'OK',
        headers: {
          'content-type': [{key: 'Content-Type', value: 'text/html'}],
          'cache-control': [{key: 'Cache-Control', value: 'max-age=300'}]
        },
        body: html
      };
      
      return response;
      
    } catch (error) {
      console.log('S3 Error:', error);
      const response = {
        status: '500',
        statusDescription: 'Internal Server Error',
        body: `Error listing directory: $${error.message}`
      };
      return response;
    }
  }
  
  // For file requests, pass through to S3
  return request;
};
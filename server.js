const http = require('http');

let server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    const output = ['Hello world!', '\nEnvironment variables:'];
    for (let name in process.env) {
        output.push(`${name}: ${process.env[name]}`);
    }
    output.push('\nHeaders:');
    for (let name in request.headers) {
        output.push(`${name}: ${request.headers[name]}`);
    }
    response.end(output.join('\n'));
});

server.listen(process.env.PORT || 8082);

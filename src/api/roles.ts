import { IncomingMessage, ServerResponse } from 'http';
import { getRoles, createRole, updateRole } from '../services/roleService';

export async function handleRolesApi(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'GET') {
    const roles = await getRoles();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(roles));
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      const data = JSON.parse(body);
      const newRole = await createRole(data);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newRole));
    });
  } else if (req.method === 'PUT') {
    const id = req.url?.split('/')[3]; // Extract ID từ URL
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      const data = JSON.parse(body);
      if (id) {
        const updatedRole = await updateRole(id, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updatedRole));
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('ID is missing');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Route not found');
  }
}

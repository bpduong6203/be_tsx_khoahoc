import { IncomingMessage, ServerResponse } from 'http';
import { getUsers, createUser, updateUser } from '../services/userService';

export async function handleUsersApi(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'GET') {
    const users = await getUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      const data = JSON.parse(body);
      const newUser = await createUser(data);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newUser));
    });
  } else if (req.method === 'PUT') {
    const id = req.url?.split('/')[3]; // Extract ID từ URL
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      const data = JSON.parse(body);
      if (id) {
        const updatedUser = await updateUser(id, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updatedUser));
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

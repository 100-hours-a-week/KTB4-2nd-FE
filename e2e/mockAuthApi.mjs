import { createServer } from 'node:http';

function readCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([name, value]) => name && value),
  );
}

function json(response, status, message, data = null, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  response.end(JSON.stringify({ message, data }));
}

createServer((request, response) => {
  if (request.headers.origin === 'http://localhost:3100') {
    response.setHeader('Access-Control-Allow-Origin', 'http://localhost:3100');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-TOKEN, Content-Type');
    response.setHeader('Vary', 'Origin');
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const cookies = readCookies(request.headers.cookie);

  if (request.url === '/__health') {
    json(response, 200, 'OK');
    return;
  }

  if (request.method === 'GET' && request.url === '/users/me') {
    if (cookies.accessToken === 'valid') {
      json(response, 200, 'USER_FOUND', {
        userId: 1,
        email: 'user@example.com',
        nickname: '여행자',
        oauthProvider: 'KAKAO',
        oauthConnected: true,
      });
    } else if (cookies.accessToken === 'missing-user') {
      json(response, 404, 'USER_NOT_FOUND');
    } else if (cookies.accessToken === 'store-down') {
      json(response, 503, 'AUTH_STORE_UNAVAILABLE');
    } else {
      json(response, 401, 'UNAUTHORIZED');
    }
    return;
  }

  if (request.method === 'GET' && request.url === '/auth/csrf') {
    json(response, 200, 'CSRF_TOKEN_ISSUED', {
      headerName: 'X-CSRF-TOKEN',
      token: 'test-csrf-token',
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/auth/token/refresh') {
    if (request.headers['x-csrf-token'] !== 'test-csrf-token') {
      json(response, 403, 'CSRF_TOKEN_INVALID');
    } else if (cookies.refreshToken === 'store-down') {
      json(response, 503, 'AUTH_STORE_UNAVAILABLE');
    } else if (cookies.refreshToken === 'valid-refresh' || cookies.refreshToken === 'stubborn') {
      json(
        response,
        200,
        'TOKEN_REFRESH_SUCCESS',
        { expiresIn: 1800 },
        {
          'Set-Cookie': [
            `accessToken=${cookies.refreshToken === 'stubborn' ? 'expired' : 'valid'}; HttpOnly; SameSite=Lax; Path=/`,
            'refreshToken=rotated; HttpOnly; SameSite=Lax; Path=/auth',
          ],
        },
      );
    } else {
      json(response, 401, 'REFRESH_TOKEN_INVALID_OR_EXPIRED');
    }
    return;
  }

  json(response, 404, 'NOT_FOUND');
}).listen(18080, 'localhost');

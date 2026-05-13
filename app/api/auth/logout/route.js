export async function POST() {
  const response = Response.json({ success: true });
  response.headers.set('Set-Cookie', 'auth-token=; Path=/; Max-Age=0');
  return response;
}
export default function handler(req: any, res: any) {
  res.status(200).json({ status: "Server is online (Vercel)!", time: new Date().toISOString() });
}

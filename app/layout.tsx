export const metadata = {
  title: '从夯到拉锐评25中所有学生',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ backgroundColor: '#efe8dc' }} className="min-h-screen">
        {children}
      </body>
    </html>
  )
}

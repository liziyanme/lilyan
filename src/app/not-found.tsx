export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 bg-tint-blue-strong">
      <div className="card-pixel rounded-pixel-lg p-6 max-w-sm text-center">
        <h2 className="font-cute-cn text-stardew-dark text-base font-bold mb-2">404</h2>
        <p className="font-cute-cn text-stardew-brown text-sm mb-6">页面不存在</p>
        <a href="/" className="btn-stardew inline-block px-6 py-2 font-cute-cn text-sm">
          返回首页
        </a>
      </div>
    </div>
  );
}

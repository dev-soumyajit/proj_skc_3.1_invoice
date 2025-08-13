import { LoginForm } from "@/components/auth/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">GST Invoice System</h1>
            <p className="text-slate-600">Admin Login Portal</p>
          </div>
          <LoginForm />
        </div>
        <div className="text-center mt-6 text-sm text-slate-500">© 2024 GST Invoice Management System</div>
      </div>
    </div>
  )
}

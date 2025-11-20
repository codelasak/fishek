import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark text-center">
        <div className="w-full max-w-md">
            <div className="mb-10">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
                    <span className="material-symbols-outlined text-5xl">receipt_long</span>
                </div>
                <h1 className="text-3xl font-bold mb-2">Tekrar hoş geldin!</h1>
                <p className="text-gray-500 dark:text-gray-400">Kişisel finansını takip etmeye devam et.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="text-left">
                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">E-posta</label>
                    <input 
                        type="email" 
                        placeholder="e-posta adresinizi girin"
                        className="w-full h-14 px-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
                <div className="text-left">
                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Şifre</label>
                    <div className="relative">
                         <input 
                            type="password" 
                            placeholder="şifrenizi girin"
                            className="w-full h-14 px-4 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                        <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <span className="material-symbols-outlined">visibility</span>
                        </button>
                    </div>
                </div>
                
                <div className="text-right">
                    <button type="button" className="text-sm font-bold text-primary">Şifremi Unuttum</button>
                </div>

                <button 
                    type="submit"
                    className="w-full h-14 bg-primary text-[#102216] rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                    Giriş Yap
                </button>
            </form>

             <div className="mt-8">
                <p className="text-gray-500 dark:text-gray-400">
                    Hesabın yok mu? <button className="text-primary font-bold ml-1">Hesap Oluştur</button>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Login;

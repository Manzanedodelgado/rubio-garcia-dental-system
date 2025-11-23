'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Simular envío de email de recuperación
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('Enviando email de recuperación a:', email);
            
            setIsSubmitted(true);
        } catch (error) {
            setError('Error al enviar el email. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                                Email Enviado
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Hemos enviado un enlace de recuperación a:
                            </p>
                            <p className="mt-1 text-center text-sm font-medium text-blue-600">
                                {email}
                            </p>
                            <p className="mt-4 text-center text-sm text-gray-500">
                                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/auth/login"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Volver al Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            🔐 Recuperar Contraseña
                        </h2>
                        <p className="text-gray-600">
                            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                📧 Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="tu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando...
                                    </div>
                                ) : (
                                    <>
                                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                                        Enviar Enlace de Recuperación
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                                Volver al Login
                            </Link>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">💡 Información</span>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 text-center space-y-2">
                            <p>
                                📱 El enlace de recuperación será válido por <strong>24 horas</strong>
                            </p>
                            <p>
                                🔒 Solo podrás usar el enlace una vez para restablecer tu contraseña
                            </p>
                            <p>
                                ❓ ¿No recibes el email? Revisa tu carpeta de spam o contacta al soporte
                            </p>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="mt-6 text-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">
                            🏥 Clínica Dental Rubio García
                        </h3>
                        <p className="text-xs text-blue-600">
                            Sistema de Gestión Integral - Acceso Seguro
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Store, AlertCircle } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, register, vendorRegister } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'vendor'>('login');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // Vendor specific
    const [storeName, setStoreName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [taxIdGst, setTaxIdGst] = useState('');
    const [panNumber, setPanNumber] = useState('');
    const [bankName, setBankName] = useState('HDFC Bank');
    const [bankAccount, setBankAccount] = useState('');
    const [bankIfsc, setBankIfsc] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (mode === 'login') {
                await login(email, password);
            } else if (mode === 'register') {
                await register({
                    name,
                    email,
                    phone,
                    password,
                    password_confirmation: passwordConfirmation,
                });
            } else {
                await vendorRegister({
                    name,
                    email,
                    phone,
                    password,
                    password_confirmation: passwordConfirmation,
                    store_name: storeName,
                    company_name: companyName,
                    tax_id_gst: taxIdGst,
                    pan_number: panNumber,
                    bank_name: bankName,
                    bank_account_number: bankAccount,
                    bank_ifsc_code: bankIfsc,
                });
            }
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication error.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Mode Selector Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                    <button
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`flex-1 py-2 rounded-xl transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode('register'); setError(''); }}
                        className={`flex-1 py-2 rounded-xl transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Customer
                    </button>
                    <button
                        onClick={() => { setMode('vendor'); setError(''); }}
                        className={`flex-1 py-2 rounded-xl transition ${mode === 'vendor' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Vendor
                    </button>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-slate-900">
                        {mode === 'login' && 'Sign in to NexCart'}
                        {mode === 'register' && 'Create Customer Account'}
                        {mode === 'vendor' && 'Register as a Vendor'}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {mode === 'login' && 'Access your marketplace orders and settings.'}
                        {mode === 'register' && 'Join thousands of satisfied shoppers.'}
                        {mode === 'vendor' && 'Onboard your retail store to our marketplace.'}
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    {mode !== 'login' && (
                        <div>
                            <label className="font-semibold text-slate-600 block mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Rajesh Sharma"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="font-semibold text-slate-600 block mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {mode !== 'login' && (
                        <div>
                            <label className="font-semibold text-slate-600 block mb-1">Phone Number</label>
                            <input
                                type="tel"
                                required
                                placeholder="+91 98765 43210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    {mode === 'vendor' && (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">Store Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Apex Electronics India"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">GSTIN</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="29AABCU9603R1Z7"
                                        value={taxIdGst}
                                        onChange={(e) => setTaxIdGst(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">PAN</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="AABCU9603R"
                                        value={panNumber}
                                        onChange={(e) => setPanNumber(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold text-slate-600 block mb-1">Company / Legal Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Apex Digital Solutions Pvt Ltd"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">Bank Account</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="50200012345678"
                                        value={bankAccount}
                                        onChange={(e) => setBankAccount(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-600 block mb-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="HDFC0000053"
                                        value={bankIfsc}
                                        onChange={(e) => setBankIfsc(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="font-semibold text-slate-600 block mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {mode !== 'login' && (
                        <div>
                            <label className="font-semibold text-slate-600 block mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition mt-2 disabled:bg-slate-300"
                    >
                        {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register Account' : 'Submit Vendor Application'}
                    </button>
                </form>
            </div>
        </div>
    );
};


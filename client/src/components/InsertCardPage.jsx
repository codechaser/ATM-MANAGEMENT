import React, { useState } from 'react';
import bg from '../assets/bg.jpg';
import Navbar from './Navbar';

const InsertCardPage = ({ handleAccountNumber }) => {
    const [accountNumber, setAccountNumber] = useState('');
    const [createMode, setCreateMode] = useState(false);
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [balance, setBalance] = useState('0');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAccountNumber(accountNumber);
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/create-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accno: accountNumber, name, pin, balance }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Unable to create account');
            }

            setMessage('Account created. You can now sign in.');
            setCreateMode(false);
            setName('');
            setPin('');
            setBalance('0');
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        
        <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#1a1a1a' }}>
            <Navbar style={{
                position: "realative",
                top: "0",
            }} />
            <div className="flex flex-col items-center justify-center" style={{
                background: `url(${bg})`,
                width: "80vw",
                height: "80vh",
                backgroundPosition: "center",
                backgroundSize: "cover",
                borderRadius: "0 0 10px 10px",
            }}>
                <div 
                style={{
                    borderRadius: "15px",
                    boxShadow: "0px 0px 20px 3px rgb(136 136 136 / 29%)",
                    border: "2px dotted #D89216",
                }}
                className='p-10 flex flex-col items-center justify-center'
                >
                    <h2 className="text-4xl font-bold mb-12 text-white">Wecome to KCT Bankers</h2>
                    <h2 className="text-2xl font-bold mb-4" 
                    style={{
                        color: "#D89216",
                    }}>{createMode ? 'Create Account' : 'Enter Account Number'}</h2>
                    {createMode ? (
                    <form onSubmit={handleCreateAccount} className="w-64 flex flex-col">
                        <input
                            type="number"
                            id="accountNumber"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
                            placeholder="Account Number"
                            required
                        />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full mb-4" placeholder="Full Name" required />
                        <input type="password" inputMode="numeric" maxLength="4" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="border border-gray-300 rounded px-3 py-2 w-full mb-4" placeholder="4-digit PIN" required />
                        <input type="number" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full mb-4" placeholder="Opening Balance" required />
                        <button
                            type="submit"
                            className=" text-white font-bold py-2 px-4 items-center justify-center rounded-full"
                            style={{
                                color: "#D89216",
                                border: "2px solid #D89216",
                            }}
                        >
                            Create Account
                        </button>
                    </form>
                    ) : (
                    <form onSubmit={handleSubmit} className="w-64 flex flex-col">
                        <input type="number" id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="border border-gray-300 rounded px-3 py-2 w-full mb-4" placeholder="Enter your Account Number" required />
                        <button type="submit" className="text-white font-bold py-2 px-4 items-center justify-center rounded-full" style={{ color: '#D89216', border: '2px solid #D89216' }}>
                            Submit
                        </button>
                    </form>
                    )}
                    {message && <p className="text-white mt-4 text-center">{message}</p>}
                    <button type="button" onClick={() => { setCreateMode(!createMode); setMessage(''); }} className="font-bold mt-5" style={{ color: '#D89216' }}>
                        {createMode ? 'Back to Sign In' : 'Create New Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InsertCardPage;

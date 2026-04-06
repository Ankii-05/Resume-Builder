import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from './Inputs';
import { validateEmail } from '../utils/helper';
import { UserContext } from '../context/userContext';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';
import { authStyles as styles } from '../assets/dummystyle';
import GoogleSignInButton from './GoogleSignInButton';

const Login = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter the password');
      return;
    }
    setError('');
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, { email, password });
      const { token } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        updateUser(response.data);
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerWrapper}>
        <h3 className={styles.title}>Welcome Back</h3>
        <p className={styles.subtitle}>Sign in to continue building amazing resumes</p>
      </div>
      <div className="mb-6">
        <GoogleSignInButton text="Continue with Google" fullWidth />
        <p className="text-center text-xs text-slate-500 font-medium mt-3">
          Secure sign-in with Google
        </p>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-violet-100" />
        <span className="text-xs font-bold text-slate-400">or email</span>
        <div className="flex-1 h-px bg-violet-100" />
      </div>
      <form onSubmit={handleLogin} className={styles.form}>
        <Input
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label="Email Address"
          placeholder="example@gmail.com"
          type="email"
        />
        <Input
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label="Password"
          placeholder="Min 8 characters"
          type="password"
        />
        {error && <div className={styles.errorMessage}>{error}</div>}
        <button type="submit" className={styles.submitButton}>
          Sign In
        </button>
        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          {typeof setCurrentPage === 'function' ? (
            <button type="button" className={styles.switchButton} onClick={() => setCurrentPage('signup')}>
              Sign Up
            </button>
          ) : (
            <Link to="/signUp" className={styles.switchButton}>
              Sign Up
            </Link>
          )}
        </p>
      </form>
    </div>
  );
};

export default Login;

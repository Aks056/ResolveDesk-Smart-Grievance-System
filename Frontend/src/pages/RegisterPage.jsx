import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import api from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, UserPlus } from "lucide-react";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: ''
  });
  
  const [localError, setLocalError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.phoneNumber) {
      return 'Please fill in all required fields';
    }
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (formData.firstName.length < 2) {
      return 'First name must be at least 2 characters long';
    }
    if (formData.lastName.length < 2) {
      return 'Last name must be at least 2 characters long';
    }
    if (!/^\d{10}$/.test(formData.phoneNumber)) {
      return 'Phone number must be exactly 10 digits';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    dispatch(loginStart());
    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      });
      
      const { token, user } = response.data;
      dispatch(loginSuccess({ token, user }));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      dispatch(loginFailure(err.response?.data?.message || err.response?.data || 'Registration failed. Please check details and try again.'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden selection:bg-primary/30">
      {/* Background Decor */}
      <div className="absolute top-0 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 -right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-2xl border-primary/10 shadow-2xl backdrop-blur-sm bg-card/80 my-8">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <UserPlus className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Register to raise and track grievances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                <Input 
                  id="firstName" 
                  placeholder="John" 
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Credentials Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
                <Input 
                  id="username" 
                  placeholder="johndoe" 
                  value={formData.username}
                  onChange={handleChange}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="john.doe@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Security Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Contact Row */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
              <Input 
                id="phoneNumber" 
                placeholder="10-digit mobile number" 
                value={formData.phoneNumber}
                onChange={handleChange}
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* Address Row (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea 
                id="address" 
                placeholder="Enter your residence address" 
                value={formData.address}
                onChange={handleChange}
                className="min-h-[80px] transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            {(localError || error) && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{localError || error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold transition-all hover:scale-[1.01]" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted-foreground/20" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;

import React from 'react';
import { 
  X, AlertTriangle, Info, CheckCircle2, AlertCircle, XCircle 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  description, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning", // 'warning', 'info', 'success', 'error'
  loading = false
}) => {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'success': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'error': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'info': return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      default: return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <Card className="relative w-full max-w-md border-none shadow-2xl ring-1 ring-border bg-card/95 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 rounded-[2rem] overflow-hidden">
        <div className={`h-1.5 w-full ${config.bg.replace('/10', '')}`} />
        
        <CardHeader className="pt-8 pb-4 text-center">
          <div className={`mx-auto w-16 h-16 rounded-3xl ${config.bg} flex items-center justify-center mb-4`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">{title}</CardTitle>
        </CardHeader>

        <CardContent className="px-8 pb-8 text-center">
          <p className="text-muted-foreground font-medium leading-relaxed">
            {description}
          </p>
        </CardContent>

        <CardFooter className="px-8 pb-8 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-2xl h-12 font-bold uppercase tracking-widest text-[10px]" 
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button 
            className={`flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 ${type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </CardFooter>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors opacity-50 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </Card>
    </div>
  );
};

export default ConfirmDialog;

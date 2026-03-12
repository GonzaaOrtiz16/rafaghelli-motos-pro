import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

interface ProductQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    title: string;
    price: number;
    barcode: string | null;
  } | null;
}

const ProductQRModal: React.FC<ProductQRModalProps> = ({ open, onOpenChange, product }) => {
  if (!product || !product.barcode) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[24px] p-0 overflow-hidden">
        <div className="bg-white p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-center text-base tracking-tight">
              Código QR del Producto
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-2xl border-2 border-zinc-100">
              <QRCodeSVG
                value={product.barcode}
                size={300}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
                includeMargin
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="font-black uppercase text-sm tracking-tight leading-tight">{product.title}</p>
            <p className="text-2xl font-black text-orange-500 italic">{formatPrice(product.price)}</p>
            <p className="text-[10px] text-zinc-400 font-bold font-mono">{product.barcode}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQRModal;

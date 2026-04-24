import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

interface ProductQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    title: string;
    price: number;
    barcode: string | null;
    id?: string;
  } | null;
}

const ProductQRModal: React.FC<ProductQRModalProps> = ({ open, onOpenChange, product }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const code = product?.barcode || product?.id || '';
  // Códigos numéricos de 8+ dígitos se renderizan como barras lineales (EAN/UPC/CODE128 numérico).
  const isNumericBarcode = /^\d{8,}$/.test(code);

  useEffect(() => {
    if (open && isNumericBarcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, code, {
          format: code.length === 13 ? 'EAN13' : code.length === 12 ? 'UPC' : 'CODE128',
          width: 2,
          height: 70,
          displayValue: true,
          fontSize: 14,
          margin: 8,
        });
      } catch {
        try {
          JsBarcode(barcodeRef.current, code, { format: 'CODE128', width: 2, height: 70, fontSize: 14, margin: 8 });
        } catch {}
      }
    }
  }, [open, code, isNumericBarcode]);

  if (!product || !code) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[24px] p-0 overflow-hidden">
        <div className="bg-white p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-center text-base tracking-tight">
              Código del Producto
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-2xl border-2 border-zinc-100">
              <QRCodeSVG
                value={code}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
                includeMargin
              />
            </div>
          </div>

          {isNumericBarcode && (
            <div className="flex justify-center">
              <div className="bg-white p-2 rounded-xl border border-zinc-100">
                <svg ref={barcodeRef} />
              </div>
            </div>
          )}

          <div className="text-center space-y-1">
            <p className="font-black uppercase text-sm tracking-tight leading-tight">{product.title}</p>
            <p className="text-2xl font-black text-orange-500 italic">{formatPrice(product.price)}</p>
            <p className="text-[10px] text-zinc-400 font-bold font-mono break-all">{code}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQRModal;

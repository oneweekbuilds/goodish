import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubscribeFormGoodHeart from "./SubscribeFormGoodHeart";

interface SubscribeModalGoodHeartProps {
  isOpen: boolean;
  onClose: () => void;
  superpower?: string;
}

export function SubscribeModalGoodHeart({ isOpen, onClose, superpower }: SubscribeModalGoodHeartProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-[#111]" style={{ fontFamily: "Inter, sans-serif" }}>
              Stay Connected
            </h3>
            <p className="text-sm text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
              Get personalized giving tips and updates
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <SubscribeFormGoodHeart />
        </div>
      </div>
    </div>
  );
}
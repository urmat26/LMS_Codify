import React from 'react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { selected, toggleSelect } = useShop();
  const { user } = useAuth();
  const isSelected = selected.includes(product.id);
  const isStudent = user?.role === 'student';
  const outOfStock = product.stock === 0;

  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden group cursor-pointer
        ${isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-100 scale-[1.01]'
          : 'border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50'
        }
        ${outOfStock ? 'opacity-60' : ''}
      `}
      onClick={() => isStudent && !outOfStock && toggleSelect(product.id)}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-44 object-cover"
        />
        {/* Badge category */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold px-2 py-1 rounded-lg">
          {product.category}
        </span>
        {/* Out of stock */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
              Нет в наличии
            </span>
          </div>
        )}
        {/* Selected check */}
        {isStudent && !outOfStock && (
          <div className={`absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-gray-300 group-hover:border-blue-400'}
          `}>
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base mb-1 font-heading">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-600 font-bold text-xl">{product.price} ₸</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg
            ${product.stock > 5 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}
          `}>
            <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 5 ? 'bg-green-500' : 'bg-orange-500'}`} />
            {product.stock > 0 ? `В наличии: ${product.stock}` : 'Нет'}
          </div>
        </div>
      </div>

      {/* Selection indicator bar */}
      {isSelected && (
        <div className="h-1 bg-blue-500 w-full" />
      )}
    </div>
  );
};

export default ProductCard;

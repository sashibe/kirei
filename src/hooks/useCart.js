import { useReducer, useCallback } from 'react';

/**
 * useCart — メイク + スキンケア統合カート
 *
 * 同一 partId は 1 商品のみ（後から追加で上書き）。
 * type: 'makeup' | 'skincare' で区別。
 */

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD':
    case 'REPLACE': {
      const { partId, type, product } = action.payload;
      const filtered = state.filter(item => item.partId !== partId);
      return [...filtered, { partId, type: type || 'makeup', product }];
    }
    case 'REMOVE': {
      return state.filter(item => item.partId !== action.payload.partId);
    }
    case 'TOGGLE': {
      const { partId, type, product } = action.payload;
      const exists = state.some(item => item.partId === partId);
      if (exists) {
        return state.filter(item => item.partId !== partId);
      }
      return [...state, { partId, type: type || 'makeup', product }];
    }
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export default function useCart() {
  const [cartItems, dispatch] = useReducer(cartReducer, []);

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product?.price || 0), 0);
  const makeupCount = cartItems.filter(i => i.type === 'makeup').length;
  const skincareCount = cartItems.filter(i => i.type === 'skincare').length;

  const isInCart = useCallback(
    (partId) => cartItems.some(item => item.partId === partId),
    [cartItems]
  );

  const handleCheckout = useCallback(() => {
    cartItems.forEach((item, i) => {
      const url = item.product?.affiliateUrl || item.product?.url;
      if (url) {
        setTimeout(() => window.open(url, '_blank'), i * 500);
      }
    });
  }, [cartItems]);

  return {
    cartItems,
    dispatch,
    totalPrice,
    makeupCount,
    skincareCount,
    isInCart,
    handleCheckout,
  };
}

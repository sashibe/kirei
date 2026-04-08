import { useReducer, useCallback } from 'react';

/**
 * useCart — メイク + スキンケア統合カート
 *
 * uniqueKey = productId + '_' + colorId でユニーク管理
 * 同カテゴリ複数商品OK（リップ2本、アイシャドウ3個など）
 * 同一商品の同一カラーは重複追加しない（トグル動作）
 */

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, selectedColor } = action.payload;
      const uniqueKey = `${product.id}_${selectedColor.id}`;
      // 同一商品×同一カラーは追加しない
      if (state.some(i => i.uniqueKey === uniqueKey)) return state;
      return [...state, {
        uniqueKey,
        product,
        selectedColor,
        category: product.category,
        price: product.price,
      }];
    }
    case 'REMOVE': {
      return state.filter(i => i.uniqueKey !== action.payload.uniqueKey);
    }
    case 'TOGGLE': {
      const { product, selectedColor } = action.payload;
      const uniqueKey = `${product.id}_${selectedColor.id}`;
      const exists = state.some(i => i.uniqueKey === uniqueKey);
      if (exists) {
        return state.filter(i => i.uniqueKey !== uniqueKey);
      }
      return [...state, {
        uniqueKey,
        product,
        selectedColor,
        category: product.category,
        price: product.price,
      }];
    }
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export default function useCart() {
  const [cartItems, dispatch] = useReducer(cartReducer, []);

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const itemCount = cartItems.length;

  const isInCart = useCallback(
    (productId, colorId) => cartItems.some(
      item => item.uniqueKey === `${productId}_${colorId}`
    ),
    [cartItems]
  );

  const handleCheckout = useCallback(() => {
    cartItems.forEach((item, i) => {
      const url = item.product?.affiliateUrl || item.product?.rakutenUrl;
      if (url && url !== '#') {
        setTimeout(() => window.open(url, '_blank'), i * 500);
      }
    });
  }, [cartItems]);

  return {
    cartItems,
    dispatch,
    totalPrice,
    itemCount,
    isInCart,
    handleCheckout,
  };
}

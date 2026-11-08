import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider, useCart } from '../context/CartContext';

// Mock useAuth so it always returns a logged-in user and lets us bypass auth checks
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isGuest: false,
    isAuthenticated: true,
    user: { uid: 'test-user-id', isAdmin: false },
    requireAuth: jest.fn(() => true),
  }),
}));

describe('CartContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  it('adds an item to the cart correctly', async () => {
    const { result } = await renderHook(() => useCart(), { wrapper });

    expect(result.current.cartItems.length).toBe(0);

    await act(async () => {
      await result.current.addToCart({
        id: 'p1',
        title: 'Test Product',
        price: '100',
        quantity: 1,
      });
    });

    expect(result.current.cartItems.length).toBe(1);
    expect(result.current.cartItems[0].title).toBe('Test Product');
    expect(result.current.cartItems[0].quantity).toBe(1);
  });

  it('updates quantity of an existing item', async () => {
    const { result } = await renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addToCart({
        id: 'p2',
        title: 'Another Product',
        price: '50',
        quantity: 1,
      });
    });

    await act(async () => {
      result.current.updateQuantity('p2', 2); // add 2 more
    });

    expect(result.current.cartItems.find(i => i.id === 'p2')?.quantity).toBe(3);
  });

  it('calculates subtotal and totalItems correctly', async () => {
    const { result } = await renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addToCart({
        id: 'p3',
        title: 'Product A',
        price: '100',
        quantity: 2,
      });
      await result.current.addToCart({
        id: 'p4',
        title: 'Product B',
        price: '250',
        quantity: 1,
      });
    });

    expect(result.current.totalItems).toBe(3);
    // 100 * 2 + 250 * 1 = 450
    expect(result.current.subtotal).toBe(450);
  });

  it('removes item from cart entirely if quantity drops to 0 or via removeFromCart', async () => {
    const { result } = await renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addToCart({ id: 'p5', title: 'Delete Me', price: '10', quantity: 1 });
    });

    expect(result.current.cartItems.length).toBeGreaterThan(0);

    await act(async () => {
      result.current.removeFromCart('p5');
    });

    expect(result.current.cartItems.find(i => i.id === 'p5')).toBeUndefined();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import App from './App';

test('renders app without crashing', () => {
  render(
    <RecoilRoot>
      <App />
    </RecoilRoot>
  );
});

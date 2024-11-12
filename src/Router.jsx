import React from 'react';
import { BabyRoutes } from 'react-baby-router';
import fastMemo from 'react-fast-memo';
import { useCat } from 'usecat';

import { isMobileWidth } from './shared/browser/device.js';
import { PrepareData } from './shared/semi/PrepareData.jsx';
import { isLoggedInCat } from './store/auth/authCats.js';
import { checkTokens, getTokens } from './store/auth/authNetwork.js';
import { Home } from './views/Home.jsx';
import { Welcome } from './views/Welcome.jsx';

async function load() {
  const urlParams = new URLSearchParams(window.location.search);
  let code = urlParams.get('code');
  if (code) {
    await getTokens(code);
  } else {
    checkTokens();
  }
}

export function Router() {
  return (
    <PrepareData load={load}>
      <AllRoutes />
    </PrepareData>
  );
}

const publicRoutes = {
  '/': Welcome,
};
const loggedInRoutes = {
  '/': Home,
};

const AllRoutes = fastMemo(() => {
  const isLoggedIn = useCat(isLoggedInCat);

  if (isLoggedIn) {
    return (
      <BabyRoutes
        routes={loggedInRoutes}
        enableAnimation={isMobileWidth()}
        bgColor="var(--semi-color-bg-0)"
        maxWidth="600px"
      />
    );
  }

  return (
    <BabyRoutes
      routes={publicRoutes}
      enableAnimation={isMobileWidth()}
      bgColor="var(--semi-color-bg-0)"
      maxWidth="600px"
    />
  );
});

import { Spin } from '@douyinfe/semi-ui';
import { RiDiceLine } from '@remixicon/react';
import React from 'react';
import fastMemo from 'react-fast-memo';

export const DiceSpinner = fastMemo(({ loading }) => {
  if (loading) {
    return <Spin indicator={<RiDiceLine />} />;
  }

  return <RiDiceLine />;
});

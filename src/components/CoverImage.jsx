import { Image, Skeleton } from '@douyinfe/semi-ui';
import React from 'react';
import fastMemo from 'react-fast-memo';

import { cardWidth } from '../lib/constants';

export const CoverImage = fastMemo(({ src }) => {
  return (
    <>
      <Image width={cardWidth} height={cardWidth} src={src} placeholder={<Skeleton.Image />} />
    </>
  );
});

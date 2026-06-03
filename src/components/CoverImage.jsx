import { Image, Skeleton } from '@douyinfe/semi-ui';
import React from 'react';
import fastMemo from 'react-fast-memo';

import { cardWidth } from '../lib/constants';

export const CoverImage = fastMemo(({ src }) => {
  if (!src) {
    return <Skeleton.Image style={{ width: cardWidth, height: cardWidth }} />;
  }

  return (
    <>
      <Image width={cardWidth} height={cardWidth} src={src} placeholder={<Skeleton.Image />} />
    </>
  );
});

import { Image, Skeleton } from '@douyinfe/semi-ui';
import React from 'react';
import fastMemo from 'react-fast-memo';

export const CoverImage = fastMemo(({ src }) => {
  return (
    <>
      <Image width={300} height={300} src={src} placeholder={<Skeleton.Image />} />
    </>
  );
});

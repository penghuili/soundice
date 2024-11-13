import { Skeleton } from '@douyinfe/semi-ui';
import React, { useEffect, useState } from 'react';
import fastMemo from 'react-fast-memo';

export const CoverImage = fastMemo(({ src }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [src]);

  return (
    <>
      <Skeleton
        style={{ width: 300, height: 300 }}
        placeholder={<Skeleton.Image />}
        loading={loading}
        active
      >
        <img width={300} height={300} src={src} />
      </Skeleton>

      {loading && <img width={0} height={0} src={src} onLoad={() => setLoading(false)} />}
    </>
  );
});

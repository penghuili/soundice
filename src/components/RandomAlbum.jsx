import { Button, Card, Spin, Typography } from '@douyinfe/semi-ui';
import { RiRefreshLine } from '@remixicon/react';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { formatDateTime } from '../shared/js/date.js';
import { Flex } from '../shared/semi/Flex';
import { IconButton } from '../shared/semi/IconButton.jsx';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingRandomAlbumCat,
  isLoadingTotalCountCat,
  randomAlbumCat,
  totalAlbumsCountCat,
} from '../store/album/albumCats.js';
import { fetchRandomAlbum, fetchTotalAlbumsCount } from '../store/album/albumNetwork.js';

export function RandomAlbum() {
  const totalCount = useCat(totalAlbumsCountCat);
  const isLoadingTotal = useCat(isLoadingTotalCountCat);
  const isLoading = useCat(isLoadingRandomAlbumCat);
  const randomAlbum = useCat(randomAlbumCat);

  useEffect(() => {
    fetchTotalAlbumsCount().then(() => fetchRandomAlbum());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You saved {totalCount} albums.{' '}
          <IconButton
            theme="borderless"
            icon={isLoadingTotal ? <Spin /> : <RiRefreshLine />}
            onClick={fetchTotalAlbumsCount}
          />
        </Typography.Title>
      )}

      <Button
        theme="solid"
        onClick={async () => {
          await fetchRandomAlbum();
        }}
        disabled={isLoading || !totalCount}
      >
        Get a random album
      </Button>

      {!!randomAlbum && (
        <Flex align="center">
          <Card
            cover={<img alt="example" src={randomAlbum.images[0].url} />}
            style={{ width: 300 }}
          >
            <Typography.Title heading={5}>{randomAlbum.name}</Typography.Title>
            <Typography.Paragraph>
              {randomAlbum.artists.map(a => (
                <Link
                  key={a.id}
                  href={a.external_urls.spotify}
                  target="_blank"
                  style={{ marginRight: '0.5rem' }}
                >
                  {a.name}
                </Link>
              ))}
            </Typography.Paragraph>
            <Typography.Paragraph>{randomAlbum.tracks.total} tracks</Typography.Paragraph>
            <Typography.Paragraph type="secondary">{randomAlbum.release_date}</Typography.Paragraph>

            <Typography.Paragraph style={{ marginTop: '1rem' }}>
              <Link href={randomAlbum.external_urls.spotify} target="_blank">
                Open in Spotify
              </Link>
            </Typography.Paragraph>
          </Card>

          <div style={{ width: 300, marginTop: '1rem' }}>
            <Typography.Paragraph>
              Saved at {formatDateTime(randomAlbum.added_at)}
            </Typography.Paragraph>
          </div>
        </Flex>
      )}
    </ItemsWrapper>
  );
}

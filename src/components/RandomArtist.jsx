import { Button, Card, Spin, Typography } from '@douyinfe/semi-ui';
import { RiRefreshLine } from '@remixicon/react';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { Flex } from '../shared/semi/Flex';
import { IconButton } from '../shared/semi/IconButton.jsx';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingAllArtistsCat,
  isLoadingTotalArtistsCountCat,
  randomArtistCat,
  totalArtistsCountCat,
} from '../store/artist/artistCats.js';
import {
  fetchAllArtists,
  fetchTotalArtistsCount,
  getRandomArtist,
} from '../store/artist/artistNetwork.js';

export function RandomArtist() {
  const totalCount = useCat(totalArtistsCountCat);
  const isLoadingTotal = useCat(isLoadingTotalArtistsCountCat);
  const isLoading = useCat(isLoadingAllArtistsCat);
  const randomArtist = useCat(randomArtistCat);

  useEffect(() => {
    fetchTotalArtistsCount()
      .then(() => fetchAllArtists())
      .then(() => getRandomArtist());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You are following {totalCount} artists.{' '}
          <IconButton
            theme="borderless"
            icon={isLoadingTotal ? <Spin /> : <RiRefreshLine />}
            onClick={fetchTotalArtistsCount}
          />
        </Typography.Title>
      )}

      <Button
        theme="solid"
        onClick={() => {
          getRandomArtist();
        }}
        disabled={isLoading || !totalCount}
      >
        Get a random artist
      </Button>

      {!!randomArtist && (
        <Flex align="center">
          <Card
            cover={<img alt="example" src={randomArtist.images[0].url} />}
            style={{ width: 300 }}
          >
            <Typography.Title heading={5}>{randomArtist.name}</Typography.Title>
            <Typography.Paragraph type="secondary">
              Followers: {randomArtist.followers.total}
            </Typography.Paragraph>

            <Typography.Paragraph style={{ marginTop: '1rem' }}>
              <Link href={randomArtist.external_urls.spotify} target="_blank">
                Open in Spotify
              </Link>
            </Typography.Paragraph>
          </Card>
        </Flex>
      )}
    </ItemsWrapper>
  );
}

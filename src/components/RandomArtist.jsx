import { Button, Card, Typography } from '@douyinfe/semi-ui';
import { RiDiceLine } from '@remixicon/react';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { Flex } from '../shared/semi/Flex';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingAllArtistsCat,
  isLoadingRandomArtistCat,
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
  const isLoading = useCat(isLoadingAllArtistsCat);
  const isLoadingRandom = useCat(isLoadingRandomArtistCat);
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
          You are following {totalCount} artists.
        </Typography.Title>
      )}

      <Button
        theme="solid"
        icon={<RiDiceLine />}
        onClick={() => {
          getRandomArtist(true);
        }}
        disabled={isLoading || !totalCount || isLoadingRandom}
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

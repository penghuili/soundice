import { Button, Card, Divider, Typography } from '@douyinfe/semi-ui';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { formatDateTime } from '../shared/js/date.js';
import { Flex } from '../shared/semi/Flex';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { Link } from '../shared/semi/Link.jsx';
import {
  isLoadingRandomPodcastCat,
  latestPodcastsCat,
  randomPodcastCat,
  totalPodcastsCountCat,
} from '../store/podcast/podcastCats.js';
import { fetchLatestPodcasts, fetchRandomPodcast } from '../store/podcast/podcastNetwork.js';
import { CoverImage } from './CoverImage.jsx';
import { DiceSpinner } from './DiceSpinner.jsx';

export function RandomPodcast() {
  const totalCount = useCat(totalPodcastsCountCat);
  const isLoading = useCat(isLoadingRandomPodcastCat);
  const randomPodcast = useCat(randomPodcastCat);
  const lastestPodcasts = useCat(latestPodcastsCat);

  useEffect(() => {
    fetchLatestPodcasts().then(() => fetchRandomPodcast());
  }, []);

  return (
    <ItemsWrapper>
      {totalCount && (
        <Typography.Title heading={5} style={{ marginTop: '1rem' }}>
          You saved {totalCount} podcast episodes.
        </Typography.Title>
      )}

      <Button
        theme="solid"
        icon={<DiceSpinner loading={isLoading} />}
        onClick={async () => {
          await fetchRandomPodcast(true);
        }}
        disabled={isLoading || !totalCount}
      >
        Get a random episode
      </Button>

      {!!randomPodcast && (
        <Flex align="center">
          <PodcastItem podcast={randomPodcast} addedAt={randomPodcast.added_at} />
        </Flex>
      )}

      {!!lastestPodcasts?.length && (
        <>
          <Divider margin="2rem" />
          <Typography.Title heading={3}>Latest saved episodes</Typography.Title>
          {lastestPodcasts.map(item => (
            <PodcastItem
              key={item.episode.id}
              podcast={item.episode}
              addedAt={item.added_at}
              topTime
            />
          ))}
        </>
      )}
    </ItemsWrapper>
  );
}

function PodcastItem({ podcast, addedAt, topTime }) {
  return (
    <div>
      {!!topTime && !!addedAt && (
        <div style={{ width: 300 }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}

      <Card cover={<CoverImage src={podcast.images[0].url} />} style={{ width: 300 }}>
        <Typography.Title heading={5}>{podcast.name}</Typography.Title>
        <Typography.Paragraph>
          <Link href={podcast.show.external_urls.spotify} target="_blank">
            {podcast.show.name}
          </Link>
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">{podcast.release_date}</Typography.Paragraph>

        <Typography.Paragraph style={{ marginTop: '1rem' }}>
          <Link href={podcast.external_urls.spotify} target="_blank">
            Open in Spotify
          </Link>
        </Typography.Paragraph>
      </Card>

      {!topTime && !!addedAt && (
        <div style={{ width: 300, marginTop: '1rem' }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}
    </div>
  );
}

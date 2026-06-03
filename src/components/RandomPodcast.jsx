import { Button, Card, Divider, Typography } from '@douyinfe/semi-ui';
import React, { useEffect } from 'react';
import { useCat } from 'usecat';

import { cardWidth } from '../lib/constants';
import { getImageUrl, getSpotifyUrl } from '../lib/spotify.js';
import { formatDateTime } from '../shared/js/date.js';
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
        size="large"
        style={{ width: cardWidth }}
        disabled={isLoading || !totalCount}
      >
        Get a random episode
      </Button>

      {!!randomPodcast && <PodcastItem podcast={randomPodcast} addedAt={randomPodcast.added_at} />}

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
        <div style={{ width: cardWidth }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}

      <Card cover={<CoverImage src={getImageUrl(podcast)} />} style={{ width: cardWidth }}>
        <Typography.Title heading={5}>{podcast.name}</Typography.Title>
        <Typography.Paragraph>
          {getSpotifyUrl(podcast.show) ? (
            <Link href={getSpotifyUrl(podcast.show)} target="_blank">
              {podcast.show.name}
            </Link>
          ) : (
            podcast.show?.name
          )}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">{podcast.release_date}</Typography.Paragraph>

        {!!getSpotifyUrl(podcast) && (
          <Typography.Paragraph style={{ marginTop: '1rem' }}>
            <Link href={getSpotifyUrl(podcast)} target="_blank">
              Open in Spotify
            </Link>
          </Typography.Paragraph>
        )}
      </Card>

      {!topTime && !!addedAt && (
        <div style={{ width: cardWidth, marginTop: '1rem' }}>
          <Typography.Paragraph>Saved at {formatDateTime(addedAt)}</Typography.Paragraph>
        </div>
      )}
    </div>
  );
}

import { Avatar, Button, Typography } from '@douyinfe/semi-ui';
import React from 'react';

import { logo } from '../shared/browser/initShared';
import { PageContent } from '../shared/browser/PageContent.jsx';
import { Flex } from '../shared/semi/Flex';
import { ItemsWrapper } from '../shared/semi/ItemsWrapper.jsx';
import { signIn } from '../store/auth/authNetwork.js';

export function Welcome() {
  return (
    <PageContent>
      <ItemsWrapper>
        <Flex direction="row" align="center" p="2rem 0 1rem" m="0" gap="0.5rem">
          <Avatar src={logo} /> <Typography.Title heading={2}>Random Spotify</Typography.Title>
        </Flex>
      </ItemsWrapper>

      <ItemsWrapper align="start">
        <Button
          theme="solid"
          onClick={async () => {
            await signIn();
          }}
        >
          Sign in
        </Button>
      </ItemsWrapper>
    </PageContent>
  );
}

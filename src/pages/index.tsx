/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState } from 'react';
import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPageLink, setNextPageLink] = useState(postsPagination.next_page);
  const [goNextPage, setGoNextPage] = useState(false);
  const [postData, setPostData] = useState(postsPagination.results);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleNextPage = () => {
    setGoNextPage(!goNextPage);

    fetch(nextPageLink)
      .then(response => response.json())
      .then(data => {
        const dataToLoad = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setPostData(postData.concat(dataToLoad));
        setNextPageLink(data?.next_page);
      });
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>

      <main>
        {postsPagination.results.map(post => (
          <Link key={post.uid} href={`post/${post.uid}`}>
            <a>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <FiCalendar />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                <FiUser />
                <small>{post.data.author}</small>
              </div>
            </a>
          </Link>
        ))}
      </main>

      {nextPageLink ? (
        false
      ) : (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a onClick={() => handleNextPage()}>Carregar mais posts</a>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: [
        'uid',
        'first_publication_date',
        'posts.title',
        'posts.subtitle',
        'posts.author',
      ],
      pageSize: 10,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};

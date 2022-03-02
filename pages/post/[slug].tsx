import { GetStaticProps } from 'next'
import React from 'react'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'

interface Props {
  post: Post
}
function Post({ post }: Props) {
  return (
    <main>
      <Header />
      <img
        src={urlFor(post.mainImage).url()}
        className="h-40 w-full object-cover"
        alt=""
      />

      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="text-gray500 mb-2 text-xl font-light">
          {post.description}
        </h2>
      </article>
    </main>
  )
}
export default Post

export const getStaticPaths = async () => {
  const query = `*[_type == "post"]{
  _id,
  slug {
    current
  }
  }`

  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current== $slug][0]{
        _id,
        _createdAt,
        title,
        author->{
        name,
        image
      },
      description,
      mainImage,
      slug,
      body
      }`
  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60, // after 60s, it'll update the old cache
  }
}

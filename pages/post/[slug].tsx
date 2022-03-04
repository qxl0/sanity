import { GetStaticProps } from 'next'
import React, { useState } from 'react'
import PortableText from 'react-portable-text'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'
import { SubmitHandler, useForm } from 'react-hook-form'

interface IFormInput {
  _id: string
  name: string
  email: string
  comment: string
}
interface Props {
  post: Post
}
function Post({ post }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>()

  const [submitted, setSubmitted] = useState(false)
  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    const res = fetch('/api/createComment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
      .then(() => {
        setSubmitted(true)
      })
      .catch((err) => {
        console.log(err)
        setSubmitted(false)
      })
  }

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
        <div>
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()}
            alt=""
          />
          <p className="text-sm font-extralight">
            Blog post by {post.author.name} - Published at{' '}
            {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div>
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="my-5 text-2xl font-bold" {...props} />
              ),
              h2: (props: any) => (
                <h1 className="my-5 text-xl font-bold" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>

      <hr className="my-5 mx-auto max-w-lg border border-yellow-500" />

      {submitted ? (
        <div className="myx-auto my-10 mx-auto flex max-w-2xl flex-col bg-yellow-500 p-10 text-white">
          <h3 className="text-3xl font-bold">
            Thank you for submitting your comment!
          </h3>
          <p>Once it has been approved, it will appear below!</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto mb-10 flex max-w-2xl flex-col p-5"
        >
          <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
          <h4 className="text-3xl font-bold">Leave a comment below</h4>
          <hr className="mt-2 py-3" />

          <input
            type="hidden"
            {...register('_id')}
            name="_id"
            value={post._id}
          />
          <label className="mb-5 block" htmlFor="">
            <span className="text-gray-700">Name</span>
            <input
              {...register('name', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              type="text"
              placeholder="John Appleseed"
            />
          </label>
          <label className="mb-5 block" htmlFor="">
            <span className="text-gray-700">Email</span>
            <input
              {...register('email', { required: true })}
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              type="text"
              placeholder="John Appleseed"
            />
          </label>
          <label className="mb-5 block" htmlFor="">
            <span className="text-gray-700">Comment</span>
            <textarea
              {...register('comment', { required: true })}
              className="rouned form-textarea mt-1 w-full border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              placeholder="John Appleseed"
              rows={8}
            />
          </label>

          <div className="flex p-5">
            {errors.name && (
              <span className="text-red-500">The Name Field is required</span>
            )}
            {errors.comment && (
              <span className="text-red-500">
                The comment Field is required
              </span>
            )}
            {errors.email && (
              <span className="text-red-500">The Email Field is required</span>
            )}
          </div>

          <input
            type="submit"
            className="focus:shadow-outline cursor-pointer rounded bg-yellow-500 py-2 px-4 font-bold text-white hover:bg-yellow-400 focus:outline-none "
          />
        </form>
      )}

      <div className="my-10 mx-auto flex max-w-2xl flex-col space-y-2 p-10 shadow shadow-yellow-500">
        <h3 className="text-4xl">Comments</h3>
        <hr className="pb-2" />
        {post.comments.map((comment) => (
          <div key={comment._id}>
            <p>
              <span className="text-yellow-500">{comment.name}</span>:
              <span className="px-2">{comment.comment}</span>
            </p>
          </div>
        ))}
      </div>
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

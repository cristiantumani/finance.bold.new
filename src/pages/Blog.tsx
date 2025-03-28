import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const blogPosts = [
  {
    id: 'budget-tracking-guide',
    title: 'The Ultimate Guide to Budget Tracking: How to Take Control of Your Finances',
    excerpt: 'Learn how to effectively track your budget and take control of your financial future with our comprehensive guide.',
    date: '2024-03-24',
    readTime: '8 min read',
    slug: 'budget-tracking-guide'
  },
  {
    id: 'budgeting-strategies-2025',
    title: 'Best Budgeting Strategies for 2025: How to Save More and Spend Smarter',
    excerpt: 'Discover the most effective budgeting strategies for 2025 and learn how to optimize your finances for the future.',
    date: '2024-03-25',
    readTime: '7 min read',
    slug: 'budgeting-strategies-2025'
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            to="/" 
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Blog
          </h1>
          <p className="text-dark-300 mt-2">
            Insights and guides to help you manage your finances better.
          </p>
        </div>

        <div className="grid gap-8">
          {blogPosts.map(post => (
            <article 
              key={post.id}
              className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700"
            >
              <div className="flex items-center gap-4 text-dark-400 text-sm mb-4">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-2xl font-bold text-dark-50 mb-3">
                {post.title}
              </h2>
              <p className="text-dark-300 mb-4">
                {post.excerpt}
              </p>
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Read More
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
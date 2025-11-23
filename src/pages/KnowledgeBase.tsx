import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, BookOpen, ThumbsUp, Eye, ArrowLeft, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  created_at: string;
}

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchTerm, selectedCategory, articles]);

  const loadData = async () => {
    setLoading(true);

    // Load categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("knowledge_base_categories")
      .select("*")
      .order("display_order");

    if (categoriesError) {
      console.error("Error loading categories:", categoriesError);
      toast.error("Failed to load categories");
    } else {
      setCategories(categoriesData || []);
    }

    // Load published articles
    const { data: articlesData, error: articlesError } = await supabase
      .from("knowledge_base_articles")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (articlesError) {
      console.error("Error loading articles:", articlesError);
      toast.error("Failed to load articles");
    } else {
      setArticles(articlesData || []);
    }

    setLoading(false);
  };

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category_id === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.content.toLowerCase().includes(term) ||
          a.excerpt?.toLowerCase().includes(term) ||
          a.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleViewArticle = async (article: Article) => {
    setSelectedArticle(article);

    // Increment view count
    await supabase
      .from("knowledge_base_articles")
      .update({ view_count: article.view_count + 1 })
      .eq("id", article.id);
  };

  const handleMarkHelpful = async () => {
    if (!selectedArticle) return;

    const { error } = await supabase
      .from("knowledge_base_articles")
      .update({ helpful_count: selectedArticle.helpful_count + 1 })
      .eq("id", selectedArticle.id);

    if (error) {
      toast.error("Failed to mark as helpful");
    } else {
      toast.success("Thank you for your feedback!");
      setSelectedArticle({
        ...selectedArticle,
        helpful_count: selectedArticle.helpful_count + 1,
      });
      loadData();
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || BookOpen;
    return <Icon className="h-5 w-5" />;
  };

  const getArticlesByCategory = (categoryId: string) => {
    return articles.filter((a) => a.category_id === categoryId);
  };

  const popularArticles = [...articles]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 px-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions and learn how to use NichePerQ
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {searchTerm || selectedCategory ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {searchTerm ? `Search results for "${searchTerm}"` : "Articles"}
              </h2>
              {selectedCategory && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchTerm("");
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to categories
                </Button>
              )}
            </div>

            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No articles found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleViewArticle(article)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span>{article.title}</span>
                        <div className="flex gap-3 text-sm text-muted-foreground font-normal">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {article.helpful_count}
                          </span>
                        </div>
                      </CardTitle>
                      {article.excerpt && (
                        <CardDescription>{article.excerpt}</CardDescription>
                      )}
                    </CardHeader>
                    {article.tags && article.tags.length > 0 && (
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Categories Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                  const articleCount = getArticlesByCategory(category.id).length;
                  return (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getCategoryIcon(category.icon)}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {category.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground mt-2">
                              {articleCount} {articleCount === 1 ? "article" : "articles"}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Popular Articles */}
            {popularArticles.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Popular Articles</h2>
                <div className="grid gap-4">
                  {popularArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleViewArticle(article)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between">
                          <span className="text-lg">{article.title}</span>
                          <div className="flex gap-3 text-sm text-muted-foreground font-normal">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {article.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {article.helpful_count}
                            </span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Article Viewer Dialog */}
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl pr-8">{selectedArticle?.title}</DialogTitle>
            </DialogHeader>

            {selectedArticle && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedArticle.view_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {selectedArticle.helpful_count} found this helpful
                  </span>
                </div>

                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedArticle.content.replace(/\n/g, "<br />"),
                    }}
                  />
                </div>

                <div className="border-t pt-6 space-y-4">
                  <p className="font-medium">Was this article helpful?</p>
                  <div className="flex gap-2">
                    <Button onClick={handleMarkHelpful}>
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Yes, this helped
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                      Close
                    </Button>
                  </div>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Still need help?
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/support">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Contact Support
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

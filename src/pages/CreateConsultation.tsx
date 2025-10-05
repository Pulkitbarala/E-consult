import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, FileText, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const consultationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  categories: z.array(z.string()).min(1, 'Please select at least one category').max(3, 'You can select up to 3 categories'),
  expires_at: z.date().min(new Date(), 'Expiry date must be in the future'),
});

type ConsultationForm = z.infer<typeof consultationSchema>;

const categories = [
  'Technology',
  'Healthcare', 
  'Business',
  'Education',
  'Legal',
  'Finance',
  'Marketing',
  'Design',
  'Engineering',
  'Research',
  'Other'
];

const CreateConsultation = () => {
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      title: '',
      description: '',
      categories: [],
      expires_at: addDays(new Date(), 7), // Default to 7 days from now
    },
  });

  const addCategory = (category: string) => {
    if (!selectedCategories.includes(category) && selectedCategories.length < 3) {
      const newCategories = [...selectedCategories, category];
      setSelectedCategories(newCategories);
      form.setValue('categories', newCategories);
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    const newCategories = selectedCategories.filter(cat => cat !== categoryToRemove);
    setSelectedCategories(newCategories);
    form.setValue('categories', newCategories);
  };

  const onSubmit = async (data: ConsultationForm) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .insert({
          title: data.title,
          description: data.description,
          category: data.categories.join(', '), // Store as comma-separated string
          expires_at: data.expires_at.toISOString(),
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Your consultation has been created successfully.',
      });

      navigate('/feed');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create consultation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={() => navigate('/my-consultations')} className="h-8 px-3 text-sm">
          <ArrowLeft className="w-3 h-3 mr-2" />
          Back
        </Button>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Create New Consultation</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Share your question or challenge with the community and get expert insights
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-80" />
        </div>
      </div>

      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium text-slate-900 dark:text-white">Consultation Details</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            Provide clear and detailed information to get the best responses from the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a clear, descriptive title for your consultation" 
                        className="text-sm h-9"
                        {...field} 
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-1">
                      <FormDescription className="text-xs text-slate-500">
                        A good title helps others understand your consultation at a glance
                      </FormDescription>
                      <span className="text-xs text-slate-500 font-medium">{field.value?.length ?? 0}/200</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed context, background information, and specific questions you'd like answered..."
                        className="min-h-[100px] text-sm resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-1">
                      <FormDescription className="text-xs text-slate-500">
                        Include relevant details, constraints, and what kind of advice you're seeking
                      </FormDescription>
                      <span className="text-xs text-slate-500 font-medium">{field.value?.length ?? 0}/2000</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Categories ({selectedCategories.length}/3)
                      </FormLabel>
                      
                      {/* Selected Categories Display */}
                      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md bg-slate-50 dark:bg-slate-800/50">
                        {selectedCategories.length === 0 ? (
                          <span className="text-xs text-slate-500 py-1">No categories selected</span>
                        ) : (
                          selectedCategories.map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-red-100 hover:text-red-700 transition-colors duration-200 cursor-pointer"
                              onClick={() => removeCategory(category)}
                            >
                              {category}
                              <X className="w-3 h-3" />
                            </Badge>
                          ))
                        )}
                      </div>

                      {/* Category Selection */}
                      <Select onValueChange={addCategory} value="">
                        <FormControl>
                          <SelectTrigger className="text-sm h-9" disabled={selectedCategories.length >= 3}>
                            <SelectValue placeholder={
                              selectedCategories.length >= 3 
                                ? "Maximum 3 categories selected" 
                                : "Add a category"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories
                            .filter(category => !selectedCategories.includes(category))
                            .map((category) => (
                            <SelectItem key={category} value={category} className="text-sm">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <FormDescription className="text-xs text-slate-500">
                        Choose up to 3 categories that best match your consultation topic
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-medium text-slate-700 dark:text-slate-300">Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal text-sm h-9",
                                !field.value && "text-slate-500"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick an expiry date</span>
                              )}
                              <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs text-slate-500">
                        Your consultation will be visible to others until this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/feed')}
                  className="flex-1 h-9 text-sm hover:bg-slate-100 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 h-9 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  {loading ? 'Creating...' : 'Create Consultation'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateConsultation;
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
import { CalendarIcon, FileText, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const consultationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.string().min(1, 'Please select a category'),
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      expires_at: addDays(new Date(), 7), // Default to 7 days from now
    },
  });

  const onSubmit = async (data: ConsultationForm) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Create New Consultation</h1>
            <p className="text-lg text-muted-foreground">
              Share your question or challenge with the community and get expert insights
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <FileText className="w-12 h-12 text-primary opacity-80" />
        </div>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold">Consultation Details</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Provide clear and detailed information to get the best responses from the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a clear, descriptive title for your consultation" 
                        className="text-base py-3"
                        {...field} 
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-2">
                      <FormDescription className="text-sm">
                        A good title helps others understand your consultation at a glance
                      </FormDescription>
                      <span className="text-sm text-muted-foreground font-medium">{field.value?.length ?? 0}/200</span>
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
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed context, background information, and specific questions you'd like answered..."
                        className="min-h-40 text-base resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-2">
                      <FormDescription className="text-sm">
                        Include relevant details, constraints, and what kind of advice you're seeking
                      </FormDescription>
                      <span className="text-sm text-muted-foreground font-medium">{field.value?.length ?? 0}/2000</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-base py-3">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm">
                        Choose the category that best matches your consultation topic
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
                      <FormLabel className="text-base font-semibold">Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal text-base py-3",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick an expiry date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      <FormDescription className="text-sm">
                        Your consultation will be visible to others until this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/feed')}
                  className="flex-1 py-3 text-base"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 btn-primary-gradient py-3 text-base font-semibold">
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
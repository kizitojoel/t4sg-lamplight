"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Database } from "@/lib/schema";
import parsePhoneNumberFromString from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent, type MouseEvent } from "react";

const roles = z.enum(["admin", "teacher"]);

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    })
    .transform((val) => val.trim()),
  bio: z
    .string()
    .max(160, {
      message: "Biography cannot be longer than 160 characters.",
    })
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  // phone validation from https://stackoverflow.com/a/78046054
  phone: z
    .string()
    .transform((arg, ctx) => {
      if (arg == "") return arg;
      const phone = parsePhoneNumberFromString(arg, {
        // set this to use a default country when the phone number omits country code
        defaultCountry: "US",

        // set to false to require that the whole string is exactly a phone number,
        // otherwise, it will search for a phone number anywhere within the string
        extract: false,
      });

      // when it's good
      if (phone?.isValid()) {
        return phone.number;
      }

      // when it's not
      ctx.addIssue({
        code: "custom",
        message: "Invalid phone number",
      });
      return z.NEVER;
    })
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  role: roles,
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [isEditing, setIsEditing] = useState(false);

  // Default values for the form fields.
  /* Because the react-hook-form (RHF) used here is a controlled form (not an uncontrolled form),
  all form fields should be set to non-undefined default values since `undefined` conflicts with controlled components.
  Read more here: https://legacy.react-hook-form.com/api/useform/
  */
  const defaultValues = {
    username: profile.display_name,
    bio: profile.biography,
    phone: profile.phone,
    role: profile.role,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const router = useRouter();

  const onSubmit = async (data: ProfileFormValues) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ biography: data.bio, display_name: data.username, phone: data.phone })
      .eq("id", profile.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsEditing(false);

    // Reset form values to the data values that have been processed by zod.
    // This way the user sees any changes that have occurred during transformation
    form.reset(data);

    // Router.refresh does not affect ProfileForm because it is a client component, but it will refresh the initials in the user-nav in the event of a username change
    router.refresh();

    return toast({
      title: "Profile updated successfully!",
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    form.reset(defaultValues);
    setIsEditing(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input readOnly={!isEditing} placeholder="Username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input readOnly placeholder={profile.email} />
          </FormControl>
          <FormDescription>This is your verified email address.</FormDescription>
          <FormMessage />
        </FormItem>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => {
            // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
            const { value, ...rest } = field;
            return (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input readOnly={!isEditing} placeholder="Phone Number" value={value ?? ""} {...rest} />
                </FormControl>
                <FormDescription>This is your phone number.</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(roles.parse(value))}
                disabled={profile.role == "admin" ? false : true}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {roles.options.map((role, index) => (
                      <SelectItem key={index} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => {
            // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
            const { value, ...rest } = field;
            return (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    readOnly={!isEditing}
                    value={value ?? ""}
                    placeholder="Tell us a little bit about yourself"
                    className="resize-none"
                    {...rest}
                  />
                </FormControl>
                <FormDescription>A short description of yourself!</FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        {isEditing ? (
          <>
            <Button type="submit" className="mr-2">
              Update profile
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={startEditing}>Edit Profile</Button>
        )}
      </form>
    </Form>
  );
}

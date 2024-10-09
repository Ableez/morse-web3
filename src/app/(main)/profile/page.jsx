"use client";

import { useState } from "react";
import {
  User,
  Pencil,
  Save,
  X,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

const initialProfile = {
  id: "1",
  name: "John Doe",
  username: "johndoe",
  email: "john@example.com",
  bio: "NFT enthusiast and digital art collector",
  accountType: "user",
  avatarUrl: "/placeholder.svg?height=100&width=100",
  walletBalance: 5.23,
  isVerified: false,
};

const sampleNFTs = [
  {
    id: "1",
    name: "Cosmic Voyage #1",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.5,
  },
  {
    id: "2",
    name: "Digital Dreams",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.3,
  },
  {
    id: "3",
    name: "Neon Nights",
    image: "/placeholder.svg?height=100&width=100",
    price: 0.7,
  },
];

export default function UserProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(initialProfile);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProfile(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked) => {
    setEditedProfile((prev) => ({ ...prev, isVerified: checked }));
  };

  const handleAccountTypeChange = (value) => {
    setEditedProfile((prev) => ({ ...prev, accountType: value }));
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleEditToggle}>
            {isEditing ? (
              <X className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              {!isEditing && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={editedProfile.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={editedProfile.username}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={editedProfile.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountType">Account Type</Label>
                      <Select
                        value={editedProfile.accountType}
                        onValueChange={handleAccountTypeChange}
                      >
                        <SelectTrigger id="accountType">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={editedProfile.bio}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="verified"
                      checked={editedProfile.isVerified}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="verified">Verified Account</Label>
                  </div>
                  <Button onClick={handleSaveProfile}>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p>{profile.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Account Type
                      </Label>
                      <p className="capitalize">{profile.accountType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Wallet Balance
                      </Label>
                      <p className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {profile.walletBalance.toFixed(2)} ETH
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verified</Label>
                      <p>{profile.isVerified ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Bio</Label>
                    <p>{profile.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="nfts" className="max-w-4xl mx-auto mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="nfts">
          <Card>
            <CardHeader>
              <CardTitle>My NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sampleNFTs.map((nft) => (
                  <Card key={nft.id}>
                    <CardContent className="p-4">
                      <div className="aspect-square relative mb-2">
                        <Image
                          src={nft.image}
                          width={500}
                          height={500}
                          alt={nft.name}
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold">{nft.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4 inline-block" />
                        {nft.price} ETH
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No recent activity to display.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

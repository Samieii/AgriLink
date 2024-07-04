"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Input,
  Textarea,
  Button,
  Avatar,
  Select,
  Divider,
  SelectItem,
  Card,
  CardBody,
  Spinner,
} from "@nextui-org/react";
import { FaEdit, FaCamera } from "react-icons/fa";
import { regions } from "@/lib/constants";
import { CldUploadButton } from "next-cloudinary";
import toast from "react-hot-toast";
import { updateFarmerDetails } from "@/services/farmportalService";
import { loginAction } from "@/services/authService";
import { Role } from "@prisma/client";

interface FarmDetails {
  image: string;
  name: string;
  bio: string;
  about: string;
  region: string;
  town: string;
}

interface EditingState {
  name: boolean;
  bio: boolean;
  about: boolean;
  region: boolean;
  town: boolean;
  image: boolean;
  paystackAccountId: boolean;
}

interface FarmerProfileProps {
  farmerDetails: {
    id: string;
    name: string;
    bio: string;
    region: string;
    about: string;
    town: string;
    image: string;
    paystackAccountId: string | null;
  } | null;
  username: string;
}

const FarmerProfile: React.FC<FarmerProfileProps> = ({
  farmerDetails,
  username,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<keyof EditingState | null>(
    null
  );
  const [farmDetails, setFarmDetails] = useState<FarmDetails>({
    image: farmerDetails?.image || "",
    name: farmerDetails?.name || "",
    bio: farmerDetails?.bio || "",
    about: farmerDetails?.about || "",
    region: farmerDetails?.region || "",
    town: farmerDetails?.town || "",
  });

  const [isEditing, setIsEditing] = useState<EditingState>({
    name: false,
    bio: false,
    about: false,
    region: false,
    town: false,
    image: false,
    paystackAccountId: false,
  });

  const [paystackAccountId, setPaystackAccountId] = useState<string | null>(
    farmerDetails?.paystackAccountId || null
  );

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFarmDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleSave = async (field: keyof EditingState) => {
    if (!farmerDetails) return;
    setIsLoading(true);
    setLoadingState(field);
    try {
      const updatedDetails = {
        [field]: farmDetails[field as keyof FarmDetails],
      };

      if (field === "paystackAccountId" && paystackAccountId) {
        updatedDetails.paystackAccountId = paystackAccountId;
      }

      const response = await updateFarmerDetails(
        farmerDetails?.id,
        updatedDetails
      );
      if (response.success) {
        toast.success("Details updated successfully");
        await loginAction(username, "123456", Role.FARMER, true);
        window.location.reload();
      } else {
        toast.error(response.error || "Failed to update details");
      }
    } catch (error) {
      toast.error("An error occurred while updating details");
    } finally {
      setIsLoading(false);
      setLoadingState(null);
    }
  };

  const handleCancel = (field: keyof EditingState) => {
    setIsEditing((prevEditing) => ({
      ...prevEditing,
      [field]: false,
    }));
  };

  const handlePaystackAccountIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaystackAccountId(e.target.value);
  };

  const handleUpload = async (result: any) => {
    try {
      const imageUrl = result.info.secure_url;
      setFarmDetails((prevDetails) => ({
        ...prevDetails,
        image: imageUrl,
      }));
      setIsEditing((prevEditing) => ({
        ...prevEditing,
        image: true,
      }));
    } catch (error) {
      toast.error("Error uploading profile picture");
    }
  };

  useEffect(() => {
    if (isEditing.image) {
      handleSave("image");
    }
  }, [isEditing.image]);

  return (
    <div className="p-6">
      <section className="mb-8">
        <h2 className="text-3xl text-gray-500 text-center font-bold mb-8">
          Profile Overview
        </h2>
        <div className="mb-4 flex flex-col items-center">
          <div className="relative">
            <Avatar
              src={farmDetails.image || ""}
              alt="Profile"
              className="mb-2 w-32 h-32 object-cover rounded-full"
            />
            {isLoading && loadingState === "image" ? (
              <div className="absolute bottom-0 right-0">
                <Spinner color="primary" size="sm" />
              </div>
            ) : (
              <CldUploadButton
                options={{ maxFiles: 1 }}
                onSuccess={handleUpload}
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                className="absolute bottom-0 right-0"
              >
                <FaCamera className="text-xl cursor-pointer hover:opacity-75" />
              </CldUploadButton>
            )}
          </div>
        </div>
        {["name", "bio", "about", "region", "town"].map((field) => (
          <Card key={field} className="mb-4">
            <CardBody>
              <label className="font-semibold text-lg text-gray-500 mb-1 capitalize">
                {field}
              </label>
              <div
                className={`flex gap-2 items-start ${
                  isEditing[field as keyof EditingState]
                    ? "flex-col"
                    : "flex-row"
                }`}
              >
                {isEditing[field as keyof EditingState] ? (
                  <>
                    {field === "about" ? (
                      <Textarea
                        name={field}
                        value={farmDetails[field as keyof FarmDetails] || ""}
                        onChange={handleInputChange}
                        fullWidth
                      />
                    ) : field === "region" ? (
                      <Select
                        name={field}
                        selectedKeys={[
                          farmDetails[field as keyof FarmDetails] || "",
                        ]}
                        onSelectionChange={(keys: any) => {
                          setFarmDetails((prevDetails) => ({
                            ...prevDetails,
                            [field]: keys.currentKey,
                          }));
                        }}
                        fullWidth
                      >
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        name={field}
                        value={farmDetails[field as keyof FarmDetails] || ""}
                        onChange={handleInputChange}
                        fullWidth
                      />
                    )}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSave(field as keyof EditingState)}
                        color="primary"
                        isLoading={isLoading && loadingState === field}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() =>
                          handleCancel(field as keyof EditingState)
                        }
                        color="danger"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-base font-medium flex-1">
                      {farmDetails[field as keyof FarmDetails]}
                    </p>
                    <FaEdit
                      className="cursor-pointer text-gray-500 hover:opacity-75"
                      size={20}
                      onClick={() =>
                        setIsEditing((prev) => ({ ...prev, [field]: true }))
                      }
                    />
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </section>
      <Divider className="my-4" />
      <section className="mt-8">
        <p className="text-3xl text-gray-500 font-bold text-center mb-8">
          Payment Information
        </p>
        <Card className="mb-4">
          <CardBody>
            {paystackAccountId ? (
              <div
                className={`flex w-full gap-2 items-start ${
                  isEditing.paystackAccountId ? "flex-col" : "flex-row"
                }`}
              >
                {isEditing.paystackAccountId ? (
                  <>
                    <Input
                      name="paystackAccountId"
                      value={paystackAccountId || ""}
                      onChange={handlePaystackAccountIdChange}
                      fullWidth
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSave("paystackAccountId")}
                        color="primary"
                        isLoading={
                          isLoading && loadingState === "paystackAccountId"
                        }
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => handleCancel("paystackAccountId")}
                        color="danger"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-base font-medium flex-1">
                      {paystackAccountId}
                    </p>
                    <FaEdit
                      className="cursor-pointer text-gray-500 hover:opacity-75"
                      size={20}
                      onClick={() =>
                        setIsEditing((prev) => ({
                          ...prev,
                          paystackAccountId: true,
                        }))
                      }
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="flex w-full">
                {isEditing.paystackAccountId ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Input
                      name="paystackAccountId"
                      value={paystackAccountId || ""}
                      onChange={handlePaystackAccountIdChange}
                      className="w-full"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSave("paystackAccountId")}
                        color="primary"
                        isLoading={
                          isLoading && loadingState === "paystackAccountId"
                        }
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => handleCancel("paystackAccountId")}
                        color="danger"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full justify-center">
                    <Button
                      onClick={() =>
                        setIsEditing((prev) => ({
                          ...prev,
                          paystackAccountId: true,
                        }))
                      }
                      color="primary"
                      className="max-w-md"
                      fullWidth
                    >
                      Add Payment Link
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
};

export default FarmerProfile;

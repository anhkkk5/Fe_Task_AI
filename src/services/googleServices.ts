const GOOGLE_CLIENT_ID =
  "313945149528-us313cakrm30r7qk2kdk9j0bnrlktmec.apps.googleusercontent.com";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleContact {
  email: string;
  name?: string;
  photoUrl?: string;
}

export interface GoogleMeetLink {
  conferenceId: string;
  meetingUri: string;
}

export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.body.appendChild(script);
  });
};

export const initGoogleSignIn = (
  callback: (token: string, user: GoogleUserInfo) => void,
  errorCallback?: (error: Error) => void,
): void => {
  // @ts-ignore - Google Identity Services
  if (typeof window.google === "undefined") {
    errorCallback?.(new Error("Google script not loaded"));
    return;
  }

  // @ts-ignore
  window.google.accounts.oauth2
    .initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      callback: (response: any) => {
        if (response.error) {
          errorCallback?.(new Error(response.error));
          return;
        }
        const accessToken = response.access_token;
        fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then((user) => {
            callback(accessToken, {
              id: user.id,
              email: user.email,
              name: user.name,
              picture: user.picture,
            });
          })
          .catch((err) => errorCallback?.(err));
      },
    })
    .requestAccessToken();
};

export const searchGoogleContacts = async (
  accessToken: string,
  query: string,
): Promise<GoogleContact[]> => {
  try {
    const response = await fetch(
      `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(query)}&pageSize=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data.results) return [];

    return data.results.map((result: any) => {
      const person = result.person;
      const email = person.emailAddresses?.[0]?.value || "";
      const name = person.names?.[0]?.displayName || email;
      const photoUrl = person.photos?.[0]?.url;
      return { email, name, photoUrl };
    });
  } catch {
    return [];
  }
};

export const getContactByEmail = async (
  accessToken: string,
  email: string,
): Promise<GoogleContact | null> => {
  try {
    const contacts = await searchGoogleContacts(accessToken, email);
    const match = contacts.find(
      (c) => c.email.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;

    return { email, name: email.split("@")[0] };
  } catch (error) {
    return { email, name: email.split("@")[0] };
  }
};

export const createGoogleMeetLink = async (
  accessToken: string,
  params: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    guests?: string[];
  },
): Promise<GoogleMeetLink | null> => {
  try {
    const event = {
      summary: params.title,
      description: params.description || "",
      start: {
        dateTime: params.startTime,
        timeZone: "Asia/Ho_Chi_Minh",
      },
      end: {
        dateTime: params.endTime,
        timeZone: "Asia/Ho_Chi_Minh",
      },
      attendees: params.guests?.map((email) => ({ email })) || [],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    const conferenceData = data.conferenceData;

    if (conferenceData?.entryPoints?.[0]) {
      return {
        conferenceId: conferenceData.conferenceId,
        meetingUri: conferenceData.entryPoints[0].uri,
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const renderGoogleSignInButton = (
  containerId: string,
  onSuccess: (token: string, user: GoogleUserInfo) => void,
  onError?: (error: Error) => void,
): void => {
  // @ts-ignore
  if (typeof window.google === "undefined") {
    onError?.(new Error("Google script not loaded"));
    return;
  }

  // @ts-ignore
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: any) => {
      if (response.credential) {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        onSuccess(response.credential, {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        });
      } else {
        onError?.(new Error("No credential received"));
      }
    },
  });

  // @ts-ignore
  window.google.accounts.id.renderButton(document.getElementById(containerId), {
    theme: "outline",
    size: "large",
    type: "standard",
    shape: "rectangular",
    text: "signin_with",
    logo_alignment: "left",
  });
};

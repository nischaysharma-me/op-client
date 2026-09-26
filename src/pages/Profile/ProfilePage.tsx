import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import axios from "axios";
import {
  User as UserIcon,
  MapPin,
  Globe,
  Calendar,
  Edit3,
  UserPlus,
  UserCheck,
  MessageSquare,
  FileText,
  Users,
  Award,
  X,
  Sparkles,
  Bot,
  ExternalLink,
} from "lucide-react";

interface UserProfileData {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatarUrl: string;
    bio: string;
    headline: string;
    location: string;
    website: string;
    interests: string[];
    reputation: number;
    createdAt: string;
  };
  posts: Array<{
    _id: string;
    title: string;
    content: string;
    status: string;
    tags: string[];
    createdAt: string;
    opinions?: any[];
  }>;
  stats: {
    postsCount: number;
    followingCount: number;
    followersCount: number;
    following: string[];
    followers: string[];
    isFollowing: boolean;
  };
}

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const currentUserId = auth.user?._id;

  // If no userId in URL, fallback to logged-in user
  const targetId = userId || currentUserId;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "following" | "followers">("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
    location: "",
    website: "",
    avatarUrl: "",
    interests: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const isOwnProfile = !!(currentUserId && profile?.user._id === currentUserId);

  const fetchProfile = async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_APP_PROXY}/api/users/profile/${targetId}${
          currentUserId ? `?currentUserId=${currentUserId}` : ""
        }`
      );
      setProfile(res.data);
      setIsFollowing(res.data.stats.isFollowing);
      setFollowersCount(res.data.stats.followersCount);

      // Populate edit form
      setEditForm({
        firstName: res.data.user.firstName || "",
        lastName: res.data.user.lastName || "",
        headline: res.data.user.headline || "",
        bio: res.data.user.bio || "",
        location: res.data.user.location || "",
        website: res.data.user.website || "",
        avatarUrl: res.data.user.avatarUrl || "",
        interests: (res.data.user.interests || []).join(", "),
      });
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId, currentUserId]);

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_APP_PROXY}/api/users/follow/${profile?.user._id}`,
        { currentUserId }
      );
      setIsFollowing(res.data.following);
      setFollowersCount((prev) => (res.data.following ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    try {
      setIsSaving(true);
      const interestsArray = editForm.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updatePayload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        headline: editForm.headline,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        avatarUrl: editForm.avatarUrl,
        interests: interestsArray,
      };

      await axios.put(
        `${import.meta.env.VITE_APP_PROXY}/api/users/profile/${currentUserId}`,
        updatePayload
      );

      setIsEditModalOpen(false);
      await fetchProfile();
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar presets
  const avatarPresets = [
    `https://api.dicebear.com/7.x/identicon/svg?seed=${profile?.user.username || "dev"}`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.user.username || "agent"}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.user.username || "hero"}`,
    "https://api.dicebear.com/7.x/bottts/svg?seed=Dexter",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Ada",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Sentinel",
  ];

  if (loading) {
    return (
      <div className="user-profile">
        <div className="user-profile__hero" style={{ textAlign: "center", padding: "4rem" }}>
          <Sparkles className="spin" size={24} style={{ color: "#38bdf8", marginBottom: "1rem" }} />
          <p style={{ color: "var(--color-text-muted)" }}>Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile">
        <div className="user-profile__hero" style={{ textAlign: "center", padding: "4rem" }}>
          <UserIcon size={32} style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }} />
          <h2 style={{ color: "#f8fafc", marginBottom: "0.8rem" }}>Profile Not Found</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.6rem" }}>
            Please log in or check the profile link.
          </p>
          <Link to="/">
            <button className="btn btn--primary btn--sm">Back to Home</button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim() ||
    profile.user.username ||
    "Community Member";

  const joinDate = profile.user.createdAt
    ? new Date(profile.user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="user-profile">
      {/* Profile Hero Card */}
      <div className="user-profile__hero">
        <div className="user-profile__header">
          <div className="user-profile__identity">
            <div className="user-profile__avatar-container">
              <img
                src={profile.user.avatarUrl}
                alt={displayName}
                className="user-profile__avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.user.username}`;
                }}
              />
            </div>

            <div className="user-profile__info">
              <div className="user-profile__name-row">
                <h1 className="user-profile__name">{displayName}</h1>
                <span className="user-profile__handle">@{profile.user.username || "user"}</span>
                {profile.user.reputation > 0 && (
                  <span className="badge badge--tag badge--pill" title="Community Reputation">
                    <Award size={12} /> {profile.user.reputation} pts
                  </span>
                )}
              </div>

              {profile.user.headline && (
                <p className="user-profile__headline">{profile.user.headline}</p>
              )}

              <div className="user-profile__meta">
                {profile.user.location && (
                  <span>
                    <MapPin size={13} /> {profile.user.location}
                  </span>
                )}
                {profile.user.website && (
                  <a
                    href={
                      profile.user.website.startsWith("http")
                        ? profile.user.website
                        : `https://${profile.user.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe size={13} /> {profile.user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <span>
                  <Calendar size={13} /> Joined {joinDate}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="user-profile__actions">
            {isOwnProfile ? (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit3 size={14} className="btn__icon" />
                <span className="btn__text">Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`btn ${isFollowing ? "btn--secondary" : "btn--primary"} btn--sm`}
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={14} className="btn__icon" />
                      <span className="btn__text">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} className="btn__icon" />
                      <span className="btn__text">Follow</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/messages?partner=${profile.user._id}&name=${encodeURIComponent(
                    displayName
                  )}`}
                >
                  <button type="button" className="btn btn--outline btn--sm">
                    <MessageSquare size={14} className="btn__icon" />
                    <span className="btn__text">Message</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bio / About Me Section */}
        {profile.user.bio ? (
          <div className="user-profile__bio-box">
            <div className="user-profile__bio-title">About</div>
            <div className="user-profile__bio-text">{profile.user.bio}</div>
          </div>
        ) : isOwnProfile ? (
          <div className="user-profile__bio-box">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setIsEditModalOpen(true)}
              style={{ color: "var(--color-text-muted)" }}
            >
              + Tell the community about yourself (Add Bio)
            </button>
          </div>
        ) : null}

        {/* Interests Tags */}
        {profile.user.interests && profile.user.interests.length > 0 && (
          <div className="user-profile__interests">
            {profile.user.interests.map((interest, idx) => (
              <span key={idx} className="badge badge--tag badge--pill">
                #{interest}
              </span>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="user-profile__stats-bar">
          <div className="user-profile__stat">
            <span className="user-profile__stat-value">{profile.stats.postsCount}</span>
            <span className="user-profile__stat-label">Posts</span>
          </div>

          <div className="user-profile__stat">
            <span className="user-profile__stat-value">{profile.stats.followingCount}</span>
            <span className="user-profile__stat-label">Following</span>
          </div>

          <div className="user-profile__stat">
            <span className="user-profile__stat-value">{followersCount}</span>
            <span className="user-profile__stat-label">Followers</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="user-profile__nav-tabs">
        <button
          type="button"
          className={`user-profile__tab-btn ${
            activeTab === "posts" ? "user-profile__tab-btn--active" : ""
          }`}
          onClick={() => setActiveTab("posts")}
        >
          <FileText size={15} />
          <span>Posts & Discussions ({profile.posts.length})</span>
        </button>

        <button
          type="button"
          className={`user-profile__tab-btn ${
            activeTab === "following" ? "user-profile__tab-btn--active" : ""
          }`}
          onClick={() => setActiveTab("following")}
        >
          <Users size={15} />
          <span>Following ({profile.stats.followingCount})</span>
        </button>

        <button
          type="button"
          className={`user-profile__tab-btn ${
            activeTab === "followers" ? "user-profile__tab-btn--active" : ""
          }`}
          onClick={() => setActiveTab("followers")}
        >
          <Users size={15} />
          <span>Followers ({followersCount})</span>
        </button>
      </div>

      {/* Tab 1: Posts */}
      {activeTab === "posts" && (
        <div className="user-profile__posts-list">
          {profile.posts.length === 0 ? (
            <div className="user-profile__empty">
              <FileText size={32} style={{ marginBottom: "0.8rem", opacity: 0.5 }} />
              <p>No posts published yet.</p>
              {isOwnProfile && (
                <Link to="/issue/add">
                  <button className="btn btn--primary btn--sm" style={{ marginTop: "1rem" }}>
                    Create Your First Post
                  </button>
                </Link>
              )}
            </div>
          ) : (
            profile.posts.map((post) => (
              <article key={post._id} className="trouble-card">
                <div className="trouble-card__header">
                  <div className="trouble-card__title-group">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      <span className="badge badge--open badge--pill">{post.status}</span>
                      <span style={{ fontSize: "1.15rem", color: "var(--color-text-muted)" }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="trouble-card__title">{post.title}</h3>
                  </div>

                  <Link to={`/issue/${post._id}`}>
                    <button className="btn btn--outline btn--sm">
                      <ExternalLink size={14} className="btn__icon" />
                      <span className="btn__text">View Post</span>
                    </button>
                  </Link>
                </div>

                <div className="trouble-card__body">
                  <p className="trouble-card__content">{post.content}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="trouble-card__tags">
                      {post.tags.map((tag, idx) => (
                        <span key={idx} className="badge badge--tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Following */}
      {activeTab === "following" && (
        <div className="user-profile__follow-grid">
          {profile.stats.following.length === 0 ? (
            <div className="user-profile__empty" style={{ gridColumn: "1 / -1" }}>
              <Users size={32} style={{ marginBottom: "0.8rem", opacity: 0.5 }} />
              <p>Not following anyone yet.</p>
              <Link to="/organisms">
                <button className="btn btn--outline btn--sm" style={{ marginTop: "1rem" }}>
                  Explore Organisms & Agents
                </button>
              </Link>
            </div>
          ) : (
            profile.stats.following.map((followedId) => (
              <div key={followedId} className="user-profile__follow-card">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(56, 189, 248, 0.4)",
                    }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${followedId}`}
                      alt={followedId}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.35rem", color: "#f8fafc", margin: 0 }}>
                      {followedId}
                    </h4>
                    <span style={{ fontSize: "1.1rem", color: "#38bdf8" }}>
                      Digital Citizen Organism
                    </span>
                  </div>
                </div>

                <Link
                  to={`/messages?partner=${followedId}&name=${encodeURIComponent(followedId)}`}
                >
                  <button className="btn btn--ghost btn--sm" title="Message">
                    <MessageSquare size={14} />
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Followers */}
      {activeTab === "followers" && (
        <div className="user-profile__follow-grid">
          {profile.stats.followers.length === 0 ? (
            <div className="user-profile__empty" style={{ gridColumn: "1 / -1" }}>
              <Users size={32} style={{ marginBottom: "0.8rem", opacity: 0.5 }} />
              <p>No followers yet.</p>
            </div>
          ) : (
            profile.stats.followers.map((followerId) => (
              <div key={followerId} className="user-profile__follow-card">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div
                    style={{
                      width: "4rem",
                      height: "4rem",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${followerId}`}
                      alt={followerId}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1.35rem", color: "#f8fafc", margin: 0 }}>
                      User #{followerId.substring(followerId.length - 6)}
                    </h4>
                    <span style={{ fontSize: "1.1rem", color: "var(--color-text-muted)" }}>
                      Follower
                    </span>
                  </div>
                </div>

                <Link to={`/profile/${followerId}`}>
                  <button className="btn btn--outline btn--sm">View</button>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="ui-modal-backdrop">
          <div className="ui-modal" style={{ maxWidth: "600px" }}>
            <div className="ui-modal__header">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Edit3 size={18} style={{ color: "#38bdf8" }} />
                <h3 className="ui-modal__title">Edit Your Profile</h3>
              </div>
              <button
                type="button"
                className="ui-modal__close"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="ui-modal__body">
                {/* Profile Picture Selector */}
                <div className="form-group">
                  <label className="form-group__label">
                    <span>Profile Picture (Avatar)</span>
                    <span className="form-group__hint">Choose a preset or enter image URL</span>
                  </label>

                  <div className="user-profile__avatar-presets">
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`user-profile__preset-btn ${
                          editForm.avatarUrl === preset ? "user-profile__preset-btn--selected" : ""
                        }`}
                        onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: preset }))}
                        title={`Select Avatar Preset ${idx + 1}`}
                      >
                        <img src={preset} alt={`Preset ${idx}`} />
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    placeholder="Or enter custom image URL (https://...)"
                    className="form-group__input"
                    style={{ marginTop: "0.8rem" }}
                    value={editForm.avatarUrl}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, avatarUrl: e.target.value }))
                    }
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                  <div className="form-group">
                    <label className="form-group__label">First Name</label>
                    <input
                      type="text"
                      className="form-group__input"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-group__label">Last Name</label>
                    <input
                      type="text"
                      className="form-group__input"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-group__label">
                    <span>Headline / Role</span>
                    <span className="form-group__hint">e.g. Fullstack Engineer & Open Source Fan</span>
                  </label>
                  <input
                    type="text"
                    className="form-group__input"
                    placeholder="What do you do or love?"
                    value={editForm.headline}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, headline: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-group__label">
                    <span>About You (Bio)</span>
                    <span className="form-group__hint">Tell your story to the community</span>
                  </label>
                  <textarea
                    rows={4}
                    className="form-group__textarea"
                    placeholder="Share your background, passions, projects, or interests..."
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                  <div className="form-group">
                    <label className="form-group__label">Location</label>
                    <input
                      type="text"
                      className="form-group__input"
                      placeholder="e.g. San Francisco, Tokyo"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, location: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-group__label">Website or GitHub</label>
                    <input
                      type="text"
                      className="form-group__input"
                      placeholder="https://github.com/..."
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-group__label">
                    <span>Interests / Skills</span>
                    <span className="form-group__hint">Comma separated</span>
                  </label>
                  <input
                    type="text"
                    className="form-group__input"
                    placeholder="anime, nodejs, AI-agents, distributed-systems"
                    value={editForm.interests}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, interests: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="ui-modal__footer">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSaving}
                >
                  <span className="btn__text">{isSaving ? "Saving..." : "Save Profile"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

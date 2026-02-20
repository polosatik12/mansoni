import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreateMenu } from "./CreateMenu";
import { PostEditorFlow } from "./PostEditorFlow";
import { StoryEditorFlow } from "./StoryEditorFlow";

export function CreatePost() {
  const [showMenu, setShowMenu] = useState(false);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [showStoryEditor, setShowStoryEditor] = useState(false);

  const handleSelectType = (type: string) => {
    if (type === "post") {
      setShowPostEditor(true);
    } else if (type === "story") {
      setShowStoryEditor(true);
    }
  };

  return (
    <>
      <div className="mx-4 my-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center gap-3">
        <img
          src="https://i.pravatar.cc/150?img=32"
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div 
          className="flex-1 text-white/50 text-sm cursor-pointer"
          onClick={() => setShowMenu(true)}
        >
          Что нового?
        </div>
        <Button 
          size="sm" 
          className="rounded-full px-5 font-semibold h-9 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm"
          onClick={() => setShowMenu(true)}
        >
          Создать
        </Button>
      </div>

      <CreateMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onSelect={handleSelectType}
      />

      <PostEditorFlow
        isOpen={showPostEditor}
        onClose={() => setShowPostEditor(false)}
      />

      <StoryEditorFlow
        isOpen={showStoryEditor}
        onClose={() => setShowStoryEditor(false)}
      />
    </>
  );
}

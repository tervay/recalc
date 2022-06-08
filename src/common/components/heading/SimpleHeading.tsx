import ShareButton, {
  ShareButtonProps,
} from "common/components/heading/ShareButton";
import { BaseState } from "common/models/ExtraTypes";

export default function SimpleHeading<State extends BaseState>(
  props: {
    title: string;
  } & ShareButtonProps<State>
): JSX.Element {
  return (
    // <nav className="level">
    //   <div className="level-item has-text-centered">
    //     <div>
    //       <p className="title">{props.title}</p>
    //     </div>
    //   </div>

    //   <div className="level-item has-text-centered">
    //     <div className="field has-addons">
    //       <p className="control">
    //         <ShareButton {...props} />
    //       </p>
    //     </div>
    //   </div>
    // </nav>
    <div className="my-6 lg:my-12 container px-6 mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-gray-300">
      <div>
        <h4 className="text-2xl font-bold leading-tight">{props.title}</h4>
      </div>
      <div className="mt-6 md:mt-0">
        <ShareButton {...props} />
      </div>
    </div>
  );
}
